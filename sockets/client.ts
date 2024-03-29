import { Namespace } from 'socket.io';
import debug from 'debug';

import videoQueue from '../lib/VideoQueue';
import Youtube from '../services/Youtube';
import { queueItemWrapper } from '../utils/wrappers';

const debugLog = debug('app:client');
const VideoQueue = videoQueue.getInstance();

const setViewers = (clientIo: Namespace, panelIo: Namespace) => {
    clientIo.clients((error: any, clients: any) => {
        if(error) throw error;
        VideoQueue.viewers = clients.length;
        panelIo.emit('set:viewers', VideoQueue.viewers);
    });
}

export default ({ clientIo, panelIo }: { clientIo: Namespace, panelIo: Namespace }) => {
    clientIo.on('connection', (client) => {
        debugLog("Client connected with id: ", client.id);
        setViewers(clientIo, panelIo);
        client.emit('set:queue', VideoQueue.get());
        
        client.on("add", async (url: string) => {
            debugLog("A client added: ", url);
            const video = await Youtube.videoInfo(url);
            const queueItem = queueItemWrapper({ socket: client, video });
            VideoQueue.add(queueItem);
            panelIo.emit('set:queue', VideoQueue.get());
            clientIo.emit('set:queue', VideoQueue.get());
        });
        
        client.on("like", (songId: string) => {
            const { clientId, title } = VideoQueue.whoAdded(songId);
            if(clientId !== client.id){
                debugLog("A client liked: ", songId);
                const validLike = VideoQueue.like(songId, client.id);
                if(validLike){
                    clientIo.to(clientId).emit('set:like', title);
                }
            }
            panelIo.emit('set:queue', VideoQueue.get());
        });
        
        client.on("disconnect", () => {
            debugLog("Client has disconnected!");
            setViewers(clientIo, panelIo);
        });
    });
}
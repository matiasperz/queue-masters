import { QueueItem, Video } from './Videos';
import debug from 'debug';

const debugLog = debug('app:queue');

class VideoQueue{
    private static instance: VideoQueue;
    private queue: QueueItem[] = [];
    private viewing: Number = 0;
    private queueSliceTop = 4;
    
    private constructor(){
        setInterval(this.printState.bind(this), 3000);
    }

    private printState(){
        debugLog(`Watching: ${this.viewing} - Videos: ${this.queue.length}`);
    }

    static getInstance(): VideoQueue{
        if(!VideoQueue.instance){
            VideoQueue.instance = new VideoQueue();
        }

        return VideoQueue.instance;
    }

    public next(){
        this.queue.shift();
    }

    public add(item: QueueItem){
        this.queue.push(item);
    }

    public get(videoId?: String): QueueItem[] | QueueItem | undefined{
        if(videoId){
            return this.queue.find((item) => {
                return item.video.id === videoId;
            });
        }

        return this.queue.length ? this.queue.slice(0, this.queueSliceTop) : [];
    }

    public shuffle(): QueueItem[]{
        const length = this.queue == null ? 0 : this.queue.length
        if (!length) {
            return [];
        }
        let index = -1;
        const lastIndex = length - 1;
        const result = [...this.queue];
        while (++index < length) {
            const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
            const value = result[rand];
            result[rand] = result[index];
            result[index] = value;
        }
        this.queue = result;
        
        return this.queue;
    }

    public like(videoId: string, clientId: string): boolean{
        const videoIndex = this.queue.findIndex(({ video }) => {
            return video.id === videoId;
        });
        if(videoIndex === -1){
            return false;
        }
        
        const alreadyLiked = this.queue[videoIndex].likes.findIndex((id) => {
            return id === clientId;
        });
        if(alreadyLiked !== -1){
            return false;
        }

        this.queue[videoIndex].likes.push(clientId);
        return true;
    }

    public whoAdded(videoId: string): {clientId: string, title: string}{
        const videoIndex = this.queue.findIndex(({ video }) => {
            return video.id === videoId;
        });

        return { 
            clientId: this.queue[videoIndex].clientId,
            title: this.queue[videoIndex].video.title
        };
    }

    public get queueLength(): Number{
        return this.queue.length;
    }

    public get viewers(): Number{
        return this.viewing;
    }

    public set viewers(viewers: Number){
        this.viewing = viewers;
    }
}

export default VideoQueue;
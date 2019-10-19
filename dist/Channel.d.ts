import { ChannelConfig } from './ChannelConfig';
import * as SocketIO from 'socket.io';
export declare class Channel {
    freeTime: number;
    readonly config: ChannelConfig;
    readonly clients: SocketIO.Socket[];
    isStreamWrap: boolean;
    private _ffmpeg;
    private _mp4Frag;
    /**
     * 
     * @param config 
     */
    constructor(config: ChannelConfig);
    startStreamWrap(): void;
    private i;
    private broadcast;
    stopStreamWrap(): void;
    /**
     *
     * @param client 
     */
    addClient(client: SocketIO.Socket): void;
    private initSegment;
    private onDisconnect;
}

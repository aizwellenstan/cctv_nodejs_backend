/// <reference types="node" />
import { Channel } from './Channel';
import { ChannelConfig } from './ChannelConfig';
import { Server } from 'http';
export declare class StreamingMediaServer {
    readonly channels: Channel[];
    private _io;
    /**
     * 
     * @param http 
     */
    constructor(http: Server);
    private onConnection;
    private onStart;
    /**
     * 
     * @param channelid 
     */
    private getChannel;
    /**
     * 
     * @param config 
     */
    createChannel(config: ChannelConfig): Channel;
    /**
     * 
     * @param channelid 
     */
    removeChannel(channel: Channel): void;
    private checkFree;
}

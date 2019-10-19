import { ChannelConfig } from './ChannelConfig';
import { spawn, ChildProcess } from 'child_process';
import { Mp4Fragment } from './Mp4Fragment';
import * as SocketIO from 'socket.io';

export class Channel {
    public freeTime: number = 0;
    public readonly config: ChannelConfig;
    public readonly clients: SocketIO.Socket[] = [];
    public isStreamWrap: boolean = false;
    private _ffmpeg: ChildProcess;
    private _mp4Frag: Mp4Fragment;
    /**
     * 
     * @param config 
     */
    public constructor(config: ChannelConfig) {
        this.config = config;
    }
    public startStreamWrap(): void {
        if (this.isStreamWrap) return;
        this.isStreamWrap = true;
        this._mp4Frag = new Mp4Fragment(undefined, data => this.broadcast(data));
        this._ffmpeg = spawn('ffmpeg', ['-loglevel', 'quiet', '-i', this.config.url, '-an', '-c:v', 'copy', '-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', 'pipe:1']);
        this._ffmpeg.stdio[1].pipe(this._mp4Frag);
    }
    private i: number = 0;
    private broadcast(data: any): void {
        console.log(++this.i);
        for (let client of this.clients) {
            if ((client as any).initSegment) client.emit('segment', data);
        }
    }
    /** 结束封装码流 */
    public stopStreamWrap(): void {
        this._ffmpeg.removeAllListeners();
        this._ffmpeg.stdio[1].unpipe(this._mp4Frag);
        this._ffmpeg.stdio[1].destroy();
        this._mp4Frag.destroy();
        (this._mp4Frag as any)._callback = null;
        this._mp4Frag = null;
        this._ffmpeg.kill();
        this._ffmpeg = null;
    }
    /**
     * 
     * @param client 
     */
    public addClient(client: SocketIO.Socket): void {
        client.once('disconnect', () => this.onDisconnect(client));
        this.clients.push(client);
        if (!this.isStreamWrap) this.startStreamWrap();
        if (this._mp4Frag.initSegment) {
            this.initSegment(client);
        }
        else {
            let timeout: NodeJS.Timeout = setInterval(() => {
                if (this._mp4Frag.initSegment) {
                    clearInterval(timeout);
                    this.initSegment(client);
                }
            }, 100);
        }
    }
    private initSegment(client: SocketIO.Socket): void {
        client.emit('segment', this._mp4Frag.initSegment);
        (client as any).initSegment = true;
    }
    private onDisconnect(client: SocketIO.Socket): void {
        let index: number = this.clients.indexOf(client);
        if (index > -1) this.clients.splice(index, 1);
    }
}
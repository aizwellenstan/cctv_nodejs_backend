/// <reference types="node" />
import { Transform, TransformOptions, TransformCallback } from 'stream';
/** MP4片段 */
export declare class Mp4Fragment extends Transform {
    private _callback;
    private _parseChunk;
    private _foundSegment;
    private _initSegment;
    private _codecString;
    private _ftypLength;
    private _ftyp;
    private _moofLength;
    private _mdatBuffer;
    private _moof;
    private _mdatBufferSize;
    private _mdatLength;
    private _readableState;
    /**
     * 
     * @param options 
     * @param callback 
     */
    constructor(options?: TransformOptions, callback?: (data: any) => void);
    initSegment: any;
    /**
     * 
     * @param chunk 
     */
    private _findFtyp;
    /**
     * 
     * @param chunk 
     */
    private _findMoov;
    /**
     * 
     * @param chunk 
     */
    private _findMoof;
    /**
     * 
     * @param chunk 
     */
    private _findMdat;
    _transform(chunk: any, encoding: string, callback: TransformCallback): void;
    _flush(callback: TransformCallback): void;
}

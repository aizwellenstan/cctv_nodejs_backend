"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
var _FTYP = Buffer.from([0x66, 0x74, 0x79, 0x70]); // ftyp
var _MOOV = Buffer.from([0x6D, 0x6F, 0x6F, 0x76]); // moov
var _MOOF = Buffer.from([0x6D, 0x6F, 0x6F, 0x66]); // moof
var _MFRA = Buffer.from([0x6d, 0x66, 0x72, 0x61]); // mfra
var _MDAT = Buffer.from([0x6D, 0x64, 0x61, 0x74]); // mdat
var _MP4A = Buffer.from([0x6d, 0x70, 0x34, 0x61]); // mp4a
var _AVCC = Buffer.from([0x61, 0x76, 0x63, 0x43]); // avcC
var Mp4Fragment = /** @class */ (function (_super) {
    __extends(Mp4Fragment, _super);
    /**
     * @param options 
     * @param callback 
     */
    function Mp4Fragment(options, callback) {
        var _this = _super.call(this, options) || this;
        if (typeof callback === 'function') {
            _this._callback = callback;
        }
        _this._parseChunk = _this._findFtyp;
        _this._foundSegment = false;
        return _this;
    }
    Object.defineProperty(Mp4Fragment.prototype, "initSegment", {
        get: function () {
            if (this._initSegment) {
                return this._initSegment;
            }
            else {
                return null;
            }
        },
        set: function (value) {
            this._initSegment = value;
            var audioString = '';
            if (this._initSegment.indexOf('mp4a') !== -1) {
                audioString = ', mp4a.40.2';
            }
            var index = this._initSegment.indexOf('avcC') + 5;
            if (index === -1) {
                console.log('No data in head');
            }
            this._codecString = "video/mp4; codecs=\"avc1." + this._initSegment.slice(index, index + 3).toString('hex').toUpperCase() + audioString + "\"";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 
     * @param chunk 
     */
    Mp4Fragment.prototype._findFtyp = function (chunk) {
        if (chunk[4] !== 0x66 || chunk[5] !== 0x74 || chunk[6] !== 0x79 || chunk[7] !== 0x70) {
            console.log('can not found fty！');
        }
        this._ftypLength = chunk.readUIntBE(0, 4);
        if (this._ftypLength < chunk.length) {
            this._ftyp = chunk.slice(0, this._ftypLength);
            this._parseChunk = this._findMoov;
            this._parseChunk(chunk.slice(this._ftypLength));
        }
        else if (this._ftypLength === chunk.length) {
            this._ftyp = chunk;
            this._parseChunk = this._findMoov;
        }
        else {
            console.log('ftyp too large！');
        }
    };
    /**
     * 
     * @param chunk 
     */
    Mp4Fragment.prototype._findMoov = function (chunk) {
        if (chunk[4] !== 0x6D || chunk[5] !== 0x6F || chunk[6] !== 0x6F || chunk[7] !== 0x76) {
            console.log('can not find moov！');
        }
        var chunkLength = chunk.length;
        var moovLength = chunk.readUIntBE(0, 4);
        if (moovLength < chunkLength) {
            this.initSegment = Buffer.concat([this._ftyp, chunk], (this._ftypLength + moovLength));
            delete this._ftyp;
            delete this._ftypLength;
            this._parseChunk = this._findMoof;
            this._parseChunk(chunk.slice(moovLength));
        }
        else if (moovLength === chunkLength) {
            this.initSegment = Buffer.concat([this._ftyp, chunk], (this._ftypLength + moovLength));
            delete this._ftyp;
            delete this._ftypLength;
            this._parseChunk = this._findMoof;
        }
        else {
            console.log('moov too large！');
        }
    };
    /**
     * 
     * @param chunk 
     */
    Mp4Fragment.prototype._findMoof = function (chunk) {
        if (chunk[4] !== 0x6D || chunk[5] !== 0x6F || chunk[6] !== 0x6F || chunk[7] !== 0x66) {
            if (this._foundSegment === false) {
                console.log('can not find moof');
            }
            else {
                if (chunk.toString().indexOf('moof') !== 1) {
                    console.log('find moof at', chunk.toString().indexOf('moof'));
                }
                if (chunk.toString().indexOf('mdat') !== 1) {
                    console.log('find mdat at ', chunk.toString().indexOf('mdat'));
                }
                console.log('can not find moof');
            }
        }
        var chunkLength = chunk.length;
        this._moofLength = chunk.readUIntBE(0, 4);
        if (this._moofLength < chunkLength) {
            this._moof = chunk.slice(0, this._moofLength);
            this._parseChunk = this._findMdat;
            this._parseChunk(chunk.slice(this._moofLength));
        }
        else if (this._moofLength === chunkLength) {
            this._moof = chunk;
            this._parseChunk = this._findMdat;
        }
        else {
            console.log('moof too small！');
        }
    };
    /**
     * 
     * @param chunk 
     */
    Mp4Fragment.prototype._findMdat = function (chunk) {
        if (this._mdatBuffer) {
            this._mdatBuffer.push(chunk);
            this._mdatBufferSize += chunk.length;
            if (this._mdatLength === this._mdatBufferSize) {
                this._foundSegment = true;
                var data = Buffer.concat([this._moof].concat(this._mdatBuffer), (this._moofLength + this._mdatLength));
                delete this._moof;
                delete this._mdatBuffer;
                delete this._moofLength;
                delete this._mdatLength;
                delete this._mdatBufferSize;
                if (this._readableState.pipesCount > 0) {
                    this.push(data);
                }
                if (this._callback) {
                    this._callback(data);
                }
                if (this.listenerCount('segment') > 0) {
                    this.emit('segment', data);
                }
                this._parseChunk = this._findMoof;
            }
            else if (this._mdatLength < this._mdatBufferSize) {
                this._foundSegment = true;
                var data = Buffer.concat([this._moof].concat(this._mdatBuffer), (this._moofLength + this._mdatLength));
                var sliceIndex = this._mdatBufferSize - this._mdatLength;
                delete this._moof;
                delete this._mdatBuffer;
                delete this._moofLength;
                delete this._mdatLength;
                delete this._mdatBufferSize;
                if (this._readableState.pipesCount > 0) {
                    this.push(data);
                }
                if (this._callback) {
                    this._callback(data);
                }
                if (this.listenerCount('segment') > 0) {
                    this.emit('segment', data);
                }
                this._parseChunk = this._findMoof;
                this._parseChunk(chunk.slice(sliceIndex));
            }
        }
        else {
            if (chunk.length < 8 || chunk.indexOf(_MDAT) !== 4) {
                console.log('Can not find mdat！');
            }
            var chunkLength = chunk.length;
            this._mdatLength = chunk.readUInt32BE(0, true);
            if (this._mdatLength > chunkLength) {
                this._mdatBuffer = [chunk];
                this._mdatBufferSize = chunkLength;
            }
            else if (this._mdatLength === chunkLength) {
                var data = Buffer.concat([this._moof, chunk], (this._moofLength + chunkLength));
                delete this._moof;
                delete this._moofLength;
                delete this._mdatLength;
                if (this._readableState.pipesCount > 0) {
                    this.push(data);
                }
                if (this._callback) {
                    this._callback(data);
                }
                if (this.listenerCount('segment') > 0) {
                    this.emit('segment', data);
                }
                this._parseChunk = this._findMoof;
            }
            else {
                var data = Buffer.concat([this._moof, chunk], (this._moofLength + this._mdatLength));
                var sliceIndex = this._mdatLength;
                delete this._moof;
                delete this._moofLength;
                delete this._mdatLength;
                if (this._readableState.pipesCount > 0) {
                    this.push(data);
                }
                if (this._callback) {
                    this._callback(data);
                }
                if (this.listenerCount('segment') > 0) {
                    this.emit('segment', data);
                }
                this._parseChunk = this._findMoof;
                this._parseChunk(chunk.slice(sliceIndex));
            }
        }
    };
    Mp4Fragment.prototype._transform = function (chunk, encoding, callback) {
        this._parseChunk(chunk);
        callback();
    };
    Mp4Fragment.prototype._flush = function (callback) {
        this._parseChunk = this._findFtyp;
        callback();
    };
    return Mp4Fragment;
}(stream_1.Transform));
exports.Mp4Fragment = Mp4Fragment;

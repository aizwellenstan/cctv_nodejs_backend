"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var Mp4Fragment_1 = require("./Mp4Fragment");
var Channel = /** @class */ (function () {
    /**
     * 
     * @param config
     */
    function Channel(config) {
        this.freeTime = 0;
        this.clients = [];
        this.isStreamWrap = false;
        this.i = 0;
        this.config = config;
    }
    Channel.prototype.startStreamWrap = function () {
        var _this = this;
        if (this.isStreamWrap)
            return;
        this.isStreamWrap = true;
        this._mp4Frag = new Mp4Fragment_1.Mp4Fragment(undefined, function (data) { return _this.broadcast(data); });
        this._ffmpeg = child_process_1.spawn('ffmpeg', ['-loglevel', 'quiet', '-i', this.config.url, '-an', '-c:v', 'copy', '-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', 'pipe:1']);
        this._ffmpeg.stdio[1].pipe(this._mp4Frag);
    };
    Channel.prototype.broadcast = function (data) {
        console.log(++this.i);
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            if (client.initSegment)
                client.emit('segment', data);
        }
    };
    Channel.prototype.stopStreamWrap = function () {
        this._ffmpeg.removeAllListeners();
        this._ffmpeg.stdio[1].unpipe(this._mp4Frag);
        this._ffmpeg.stdio[1].destroy();
        this._mp4Frag.destroy();
        this._mp4Frag._callback = null;
        this._mp4Frag = null;
        this._ffmpeg.kill();
        this._ffmpeg = null;
    };
    /**
     * 
     * @param client 
     */
    Channel.prototype.addClient = function (client) {
        var _this = this;
        client.once('disconnect', function () { return _this.onDisconnect(client); });
        this.clients.push(client);
        if (!this.isStreamWrap)
            this.startStreamWrap();
        if (this._mp4Frag.initSegment) {
            this.initSegment(client);
        }
        else {
            var timeout_1 = setInterval(function () {
                if (_this._mp4Frag.initSegment) {
                    clearInterval(timeout_1);
                    _this.initSegment(client);
                }
            }, 0);
        }
    };
    Channel.prototype.initSegment = function (client) {
        client.emit('segment', this._mp4Frag.initSegment);
        client.initSegment = true;
    };
    Channel.prototype.onDisconnect = function (client) {
        var index = this.clients.indexOf(client);
        if (index > -1)
            this.clients.splice(index, 1);
    };
    return Channel;
}());
exports.Channel = Channel;

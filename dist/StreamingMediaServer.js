"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Channel_1 = require("./Channel");
var SocketIO = require("socket.io");
var StreamingMediaServer = /** @class */ (function () {
    /**
     * 
     * @param http 
     */
    function StreamingMediaServer(http) {
        var _this = this;
        this.channels = [];
        this._io = SocketIO.listen(http);
        this._io.on('connection', function (client) { return _this.onConnection(client); });
        setInterval(function () { return _this.checkFree(); }, 10000);
    }
    StreamingMediaServer.prototype.onConnection = function (client) {
        var _this = this;
        client.once('start', function (msg) { return _this.onStart(client, msg); });
    };
    StreamingMediaServer.prototype.onStart = function (client, msg) {
        var config = JSON.parse(msg);
        var channel = this.getChannel(config.channelid);
        if (!channel)
            channel = this.createChannel(config);
        channel.addClient(client);
    };
    /**
     * 
     * @param channelid 
     */
    StreamingMediaServer.prototype.getChannel = function (channelid) {
        for (var _i = 0, _a = this.channels; _i < _a.length; _i++) {
            var channel = _a[_i];
            if (channel.config.channelid == channelid)
                return channel;
        }
        return null;
    };
    /**
     * 
     * @param config 
     */
    StreamingMediaServer.prototype.createChannel = function (config) {
        var channel = new Channel_1.Channel(config);
        this.channels.push(channel);
        return channel;
    };
    /**
     * 
     * @param channelid 
     */
    StreamingMediaServer.prototype.removeChannel = function (channel) {
        var index = this.channels.indexOf(channel);
        if (index > -1) {
            this.channels.splice(index, 1);
            channel.stopStreamWrap();
        }
    };
    StreamingMediaServer.prototype.checkFree = function () {
        for (var _i = 0, _a = this.channels; _i < _a.length; _i++) {
            var channel = _a[_i];
            if (channel.clients.length > 0)
                channel.freeTime = 0;
            else
                channel.freeTime += 10;
            if (channel.freeTime >= 60)
                this.removeChannel(channel);
        }
    };
    return StreamingMediaServer;
}());
exports.StreamingMediaServer = StreamingMediaServer;

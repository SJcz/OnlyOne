
const cluster = require('cluster');
const utils = require('../utils');

class RoomHandler {
    constructor(app) {
        this.app = app;
    }
    getRoomList() {
        return ['onlyOne'];
    }

    joinRoom({ roomName }, session) {
        if (roomName !== 'onlyOne') throw new Error('只能进入 onlyOne 房间');
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(roomName, true);
        channel.add({userId: session.userId, sessionId: session.id});
        channel.pushMessage({route: 'joinRoom', data: {roomName, userId: session.userId}});
        utils.notifyMainProcess({route: "joinRoom", data: {roomName, userId: session.userId}});
        return { roomName, userId: session.userId }
    }

    getRoomAllUser({ roomName }, session) {
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(roomName);
        
        // 对其他子进程调用时通过进程间消息传递还是 通过 socket 连接调用, 有待考虑
        for (let id in cluster.workers) {
            cluster.workers[id].sessionId()
        }
    }
}



module.exports = (app) => {
    return new RoomHandler(app)
};



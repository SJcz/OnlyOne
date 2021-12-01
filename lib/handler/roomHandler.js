
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
        channel.add({ userId: session.userId, sessionId: session.id });
        this.app.redisService.publish('channel', { route: 'room.join', data: { roomName, userId: session.userId } });
        return { roomName, userId: session.userId }
    }

    leaveRoom({ roomName }, session) {
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(roomName);
        if (!channel) return;
        channel.leave(session.userId);
        this.app.redisService.publish('channel', { route: 'room.leave', data: { roomName, userId: session.userId } });
        return 'ok';
    }

    // async getRoomAllUser({ roomName }, session) {
    //     const channelService = this.app.get('channelService');
    //     const channel = channelService.getChannel(roomName);

    //     await this.app.requestMainProcess({route: 'getRoomAllUser', data: { roomName }});
    // }
}



module.exports = (app) => {
    return new RoomHandler(app)
};




class RoomHandler {
    constructor(app) {
        this.app = app;
    }
    getRoomList() {
        return ['onlyOne'];
    }

    joinRoom({ room_id }, session) {
        if (room_id !== 'onlyOne') throw new Error('只能进入 onlyOne 房间');
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(room_id, true);
        channel.add({ userId: session.userId, sessionId: session.id });
        this.app.redisService.publish('channel', { route: 'room.join', data: { room_id, user: session.user } });
        return { room_id, user: session.user }
    }

    leaveRoom({ room_id }, session) {
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(room_id);
        if (!channel) return;
        channel.leave(session.userId);
        this.app.redisService.publish('channel', { route: 'room.leave', data: { room_id, user: session.user } });
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



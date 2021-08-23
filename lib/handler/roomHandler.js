
class RoomHandler {
    constructor(app) {
        this.app = app;
    }
    getRoomList() {
        return ['onlyOne'];
    }

    joinRoom({ roomName }, session) {
        if (roomName !== 'onlyOne') throw new Error('只能进入 onlyOne 房间');
        const channelManager = this.app.get('channelManager');
        const channel = channelManager.getChannel(roomName, true);
        channel.add({userId: session.userId, sessionId: session.id});
        return { roomName, userId: session.userId }
    }
}



module.exports = (app) => {
    return new RoomHandler(app)
};



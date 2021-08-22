
class RoomHandler {
    constructor(app) {
        this.app = app;
    }
    getRoomList() {
        return ['onlyOne'];
    }

    joinRoom({ roomId }, session) {
        if (roomId !== 'onlyOne') throw new Error('只能进入 onlyOne 房间');
        const channel = this.app.getChannel();
        const room = channel.getRoom(roomId, true);
        room.addUser({userId: session.userId, sessionId: session.id});
        return { roomId, userId: session.userId }
    }
}



module.exports = (app) => {
    return new RoomHandler(app)
};



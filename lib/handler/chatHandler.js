
class ChatHandler {
    constructor(app) {
        this.app = app;
    }

    chat({ roomId, content }, session) {
        const channel = this.app.getChannel();
        channel.broadcast(roomId, content);
        channel.broadcastMainProcess(roomId, content);
        return 'ok';
    }
}



module.exports = (app) => {
    return new ChatHandler(app)
};




class ChatHandler {
    constructor(app) {
        this.app = app;
    }

    chat({ roomName, content }, session) {
        const channelManager = this.app.get('channelManager');
        const channel = channelManager.getChannel(roomName);
        if (channel) {
            channel.pushMessage({roomName, content});
            channel.pushMessage2MainProcess({roomName, content});
        }
        return 'ok';
    }
}



module.exports = (app) => {
    return new ChatHandler(app)
};



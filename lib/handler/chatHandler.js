class ChatHandler {
    constructor(app) {
        this.app = app;
    }

    chat({ roomName, content }, session) {
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(roomName);
        if (channel) {
            this.app.redisService.publish('channel', {route: 'chat', data: {roomName, content, userId: session.userId}});
        }
        return 'ok';
    }
}



module.exports = (app) => {
    return new ChatHandler(app)
};



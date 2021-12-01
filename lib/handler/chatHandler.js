class ChatHandler {
    constructor(app) {
        this.app = app;
    }

    chat({ roomName, chat }, session) {
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(roomName);
        if (channel) {
            chat.sender = {
                user_id: session.userId,
                avatar: session.user.avatar || 'http://thirdwx.qlogo.cn/mmopen/TSbwFeVEdd416hDbias6sDnyWiaicZmLmvDQ7xtggmUnkrU3Wc0aJWwYWWvkW8mtM040sYbPx0GGcbdKqabnDowofceKHgWJKFy/132'
            };
            chat.send_time = Date.now();
            this.app.redisService.publish('channel', { 
                route: 'room.chat', 
                data: { 
                    roomName, 
                    chat
                } 
            });
        }
        return 'ok';
    }
}



module.exports = (app) => {
    return new ChatHandler(app)
};



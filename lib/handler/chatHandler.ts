import App from "../app";
import WSSession from "../connector/ws.session";

class ChatHandler {
    app: App;
    constructor(app: App) {
        this.app = app;
    }

    chat({ room_id, chat_message }, session: WSSession) {
        const channelService = this.app.get('channelService');
        const channel = channelService.getChannel(room_id);
        if (!channel) {
            console.log(`chatHandler.chat: 找不到room_id=${room_id} 对应的频道`);
            return 'fail';
        }
        this.app.redisService.publish('channel', {
            route: 'room.chat',
            data: {
                room_id,
                chat_message,
                send_time: Date.now(),
                sender: session.user
            }
        });
        return 'ok';
    }
}



module.exports = (app) => {
    return new ChatHandler(app)
};



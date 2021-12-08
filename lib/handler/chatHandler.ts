import App from "../app";
import { Channel, ChannelService } from "../channel/channelService";
import WSSession from "../connector/ws.session";
import { RedisMessageRoute } from "../define/interface/constant";

class ChatHandler {
    app: App;
    constructor(app: App) {
        this.app = app;
    }

    chat({ room_id, chat_message }: IChatRequestBody, session: WSSession) {
        const channelService = this.app.get('channelService') as ChannelService;
        const channel = channelService.getChannel(room_id);
        if (!channel) {
            console.log(`chatHandler.chat: 找不到room_id=${room_id} 对应的频道`);
            return 'fail';
        }
        this.app.redisService.publish('channel', {
            route: RedisMessageRoute.ROOM_CHAT,
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

interface IChatRequestBody {
    room_id: string;
    chat_message: {
        type: string;
        path?: string;
        content?: string;
    };
}

module.exports = (app: App) => {
    return new ChatHandler(app)
};



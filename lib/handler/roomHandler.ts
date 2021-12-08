import App from "../app";
import { ChannelService } from "../channel/channelService";
import WSSession from "../connector/ws.session";
import { IRoomUserNum } from "../define/interface/common";
import { RedisMessageRoute } from "../define/interface/constant";

class RoomHandler {
    app: App;
    constructor(app: App) {
        this.app = app;
    }
    getRoomList() {
        return ['onlyOne'];
    }

    joinRoom({ room_id }: IJoinRoomRequestBody, session: WSSession) {
        if (room_id !== 'onlyOne') throw new Error('只能进入 onlyOne 房间');
        const channelService = this.app.get('channelService') as ChannelService;
        const channel = channelService.getChannel(room_id, true);
        channel.add({ userId: session.userId, sessionId: session.id });
        this.app.redisService.publish('channel', { route: RedisMessageRoute.ROOM_JOIN, data: { room_id, user: session.user } });
        return { room_id, user: session.user }
    }

    leaveRoom({ room_id }: ILeaveRoomRequestBody, session: WSSession) {
        const channelService = this.app.get('channelService') as ChannelService;
        const channel = channelService.getChannel(room_id);
        if (!channel) return;
        channel.leave(session.userId);
        this.app.redisService.publish('channel', { route: RedisMessageRoute.ROOM_LEAVE, data: { room_id, user: session.user } });
        return 'ok';
    }

    async getRoomAllUserNum({ room_id }: IGetRoomAllUserNumRequestBody, session: WSSession) {
        const allRoomUserNum = this.app.get('allRoomUserNum') as IRoomUserNum;
        return allRoomUserNum[room_id] || 0;
    }
}

interface IJoinRoomRequestBody {
    room_id: string;
}

interface ILeaveRoomRequestBody {
    room_id: string;
}


interface IGetRoomAllUserNumRequestBody {
    room_id: string;
}



export = (app: App) => {
    return new RoomHandler(app)
};



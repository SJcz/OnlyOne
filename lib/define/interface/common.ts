export interface IUser {
    userId: string;
    avatar: string;
    username: string;
}

export interface IChannelUser {
    userId: string;
    sessionId: string | number;
}

/**app 启动配置 */
export interface IStartOptions {
    port: number;
    connector?: string;
}

export interface IBasicMessage {
    type: string;
    data: unknown;
}
export interface IPushMessage extends IBasicMessage {
    route: string;
}

export interface IRequestMessage extends IBasicMessage {
    requestId: number;
    route: string;
}

export interface IResponseMessage extends IBasicMessage {
    requestId: number;
    code: number;
}

export interface IRedisChannelMessage {
    data: any;
    route: string;
}

/**房间人数信息 */
export interface IRoomUserNum {
    [name: string]: number
}

/**房间聊天消息数据 */
export interface IRoomMessage {
    room_id: string;
    sender: {
        user_id: string;
        avatar: string;
    }
    chat_message: {
        type: string;
        path?: string;
        content?: string;
    }
    sent_time: number;
}



class ChannelService {
    constructor(app) {
        this.app = app;
        this.channelList = {};
    }

    createChannel(name) {
        if (!this.channelList[name]) {
            this.channelList[name] = new Channel(this, name);
        }
        return this.channelList[name];
    }

    getChannel(name, mk = false) {
        if (mk) return this.createChannel(name);
        return this.channelList[name];
    }

    destroyChannel(name) {
        delete this.channelList[name];
    }

    leave(userId) {
        for (let name in this.channelList) {
            this.channelList[name].leave(userId);
        }
    }

    broadcast(msg) {
        for (let name in this.channelList) {
            this.channelList[name].pushMessage(msg);
        }
    }
}

const ST_INITED = 0;
const ST_DESTROYED = 1;

class Channel {
    constructor(channelService, name) {
        this.__channelService__ = channelService;
        this.name = name;
        this.userList = {};
        this.state = ST_INITED;
    }

    getAllUser() {
        return this.userList;
    }

    add(user) {
        this.userList[user.userId] = user;
    }

    leave(userId) {
        delete this.userList[userId];
    }

    destroy() {
        this.state = ST_DESTROYED;
        this.__channelService__.destroyChannel(this.name);
    }

    /**
     * 频道内推送消息
     * msg: { type: 消息类型 push, route: 路由标识, 告诉对方该如何处理这个消息, data: 实际的消息体}
     * @param {*} msg 
     */
    pushMessage(msg) {
        msg.type = 'push';
        const sessionList = this.__channelService__.app.get('sessionList');
        const sessions = Object.values(this.userList).map(item => sessionList[item.sessionId]);
        sessions.forEach(session => session.send(msg)); // 推送消息给用户
    }
}

module.exports = (app) => {
    return new ChannelService(app);
}
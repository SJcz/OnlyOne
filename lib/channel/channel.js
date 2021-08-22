class Channel {
    constructor(app) {
        this.app = app;
        this.roomList = {};
    }
    getInstance() {
        if (!Channel.instance) {
            Channel.instance = new Channel();
        }
        return Channel.instance;
    }

    getRoom(roomId, mk = false) {
        if (mk && !this.roomList[roomId]) this.roomList[roomId] = new Room(this);
        return this.roomList[roomId];
    }

    leave(userId) {
        for (let roomId in this.roomList) {
            delete this.roomList[roomId].userList[userId];
        }
    }

    broadcast(roomId, msg) {
        const room = this.getRoom(roomId);
        if (room) room.broadcast(msg);
    }

    broadcastMainProcess(roomId, msg) {
        process.send({
            type: 'channel',
            data: {
                roomId,
                msg
            }
        });
    }
}

class Room {
    constructor(channel) {
        this.channel = channel;
        this.userList = {};
    }

    addUser(user) {
        this.userList[user.userId] = user;
    }

    delUser(userId) {
        delete this.userList[userId];
    }

    broadcast(msg) {
        const sessionMap = this.channel.app.sessionMap;
        const sessions = Object.values(this.userList).map(item => sessionMap[item.sessionId]);
        sessions.forEach(session => session.send({
            code: 0,
            data: msg
        }));
    }
}

module.exports = (app) => {
    return new Channel(app);
}
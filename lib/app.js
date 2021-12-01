const events = require('events');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const redisService = require('./redis/redisService');

class App extends events.EventEmitter {
    start(opts) {
        opts = opts || {};
        this.handlers = {};
        this.channelService = null;
        this.connector = this.getScoketConnector(opts);
        this.connector.start(opts);
        this.sessionList = {};
        this.redisService = redisService(this);
        this._initEvents();
        this._initHandlers();
        this._initChannelService();
        setInterval(() => {
            const userIds = Object.values(this.sessionList).map(session => session.userId);
            const memoryUsage = process.memoryUsage();
            const [heapTotal, heapUsed, rss] = [Math.trunc(memoryUsage.heapTotal / 1024 / 1024), Math.trunc(memoryUsage.heapUsed / 1024 / 1024), Math.trunc(memoryUsage.rss / 1024 / 1024)]
            console.log(`进程 ${process.pid} 当前维持了 ${userIds.length} 个连接, 当前申请内存=${heapTotal} M  使用内存=${heapUsed} M , rss =${rss} M`);
        }, 10000);
    }

    _initEvents() {
        this.connector.on('connection', this.handleConnection.bind(this));
        this.on('channel', (message) => {
            message = JSON.parse(message);
            if (['room.chat', 'room.join', 'room.leave'].includes(message.route)) {
                const channel = this.channelService.getChannel(message.data.roomName);
                if (channel) channel.pushMessage(message);
            }
        });
    }

    _initHandlers() {
        const scanFiles = this._scanHandlerFolder();
        this._generateHandlerMethodMap(scanFiles);
    }

    _initChannelService() {
        const channelServiceObj = require('./channel/channelService');
        if (typeof channelServiceObj !== 'function') return;
        this.channelService = channelServiceObj(this);
    }

    _scanHandlerFolder() {
        const dirPath = path.join(process.cwd(), './lib/handler');
        const files = fs.readdirSync(dirPath);
        return files.map(file => {
            const filePath = path.resolve(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && /\.(js)|(jsx)/.test(path.extname(file))) return filePath;
        }).filter(file => !!file);
    }

    _generateHandlerMethodMap(scanFiles) {
        if (scanFiles.length === 0) {
            console.warn('there is no any handler file provide');
        }
        for (let filePath of scanFiles) {
            const handlerName = path.basename(filePath).replace(/\.(js)|(jsx)$/, '');

            let handlerObj = require(filePath);
            if (typeof handlerObj !== 'function') continue;
            handlerObj = handlerObj(this);
            Object.assign(handlerObj, {
                filePath: filePath,
                methodList: [],
                name: handlerName,
            });
            this.handlers[handlerName] = handlerObj;

            for (let methodName in handlerObj) {
                if (typeof handlerObj[methodName] === 'function') {
                    this.handlers[handlerName].methodList.push(methodName);
                }
            }
        }
    }

    handleConnection(session) {
        this.sessionList[session.id] = session;
        // 因为不需要登录, 所以连接上直接给一个用户Id
        const userId = uuid.v4();
        session.set('userId', userId);
        session.set('user', { userId });
        session.on('message', this.handleMessage.bind(this, session));
        session.on('error', (error) => {
            console.log(error);
        });
        session.on('close', () => {
            delete this.sessionList[session.id];
            this.channelService.leave(session.userId);
        });
        // console.log(`${userId} 连接到进程 ${process.pid}`);
    }

    // msg { route, data }
    async handleMessage(session, msg) {
        console.log(`收到 ${session.userId} 的消息: ${JSON.stringify(msg)}`);
        if (msg.route) {
            const [handlerName, method] = msg.route.split('.');
            if (this.handlers[handlerName] && typeof this.handlers[handlerName][method] === 'function') {
                try {
                    const result = await this.handlers[handlerName][method](msg.data || {}, session);
                    return session.send({ type: 'response', code: 0, data: result });
                } catch (err) {
                    console.error(err);
                    return session.send({ type: 'response', code: 500, data: '服务器错误' });
                }
            }
            return session.send({ type: 'response', code: 404, data: '找不到对应的 handler' });
        }
        session.send({ type: 'response', code: 501, data: '服务器收到未知消息' });
    }

    getScoketConnector(opts) {
        if (!opts.connector) return this._getDetaultScocketConnector();
        return this._getDetaultScocketConnector();
    }

    _getDetaultScocketConnector() {
        const WSConnector = require('./connector/ws.connector');
        return new WSConnector();
    }

    get(key) {
        if (['channelService', 'sessionList'].includes(key)) return this[key];
        throw new Error(`app 不能获取 ${key}`)
    }
}

module.exports = App;



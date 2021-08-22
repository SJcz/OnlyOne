const events = require('events');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');

class App extends events.EventEmitter {
    start(opts) {
        opts = opts || {};
        this.handlers = {};
        this.channel = null;
        this.connector = this.getScoketConnector(opts);
        this.connector.start(opts);
        this.sessionMap = {};
        this._initEvents();
        this._initProcessEvents();
        this._initHandlers();
        this._initChannel();
        setInterval(() => {
            const userIds = Object.values(this.sessionMap).map(session => session.userId)
            console.log(`进程 ${process.pid} ${JSON.stringify(userIds)}`);
        }, 5000);
    }

    _initEvents() {
        this.connector.on('connection', this.handleConnection.bind(this));
    }

    _initProcessEvents() {
        process.on('message', (message) => {
            if (message.type == 'channel') {
                this.channel.broadcast(message.data.roomId, message.data.msg);
            }
        });
    }

    _initHandlers() {
        const scanFiles = this._scanHandlerFolder();
        this._generateHandlerMethodMap(scanFiles);
        console.log('handlers 初始化完成');
    }

    _initChannel() {
        const channelObj = require('./channel/channel');
        if ( typeof channelObj !== 'function') return;
        this.channel = channelObj(this);
        console.log('channel 初始化完成');
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
            if ( typeof handlerObj !== 'function') continue;
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
        this.sessionMap[session.id] = session;
        // 因为不需要登录, 所以连接上直接给一个用户Id
        const userId = uuid.v4();
        session.set('userId', userId);
        session.set('user', { userId });
        session.on('message', this.handleMessage.bind(this, session));
        session.on('close', () => {
            this.channel.leave(session.userId);
            delete this.sessionMap[session.id];
        });
        console.log(`${userId} 连接到进程 ${process.pid}`);
    }

    // msg { route, params }
    //
    async handleMessage(session, msg) {
        if (msg.route) {
            const [ handlerName, method ] = msg.route.split('.');
            if (this.handlers[handlerName] && typeof this.handlers[handlerName][method] === 'function') {
                try {
                    const result = await this.handlers[handlerName][method](msg.params || {}, session);
                    return session.send({code: 0, data: result});
                } catch (err) {
                    console.error(err);
                    return session.send({code: 500, error: '服务器错误'});
                }
            }
            console.log(`${process.pid} 收到请求, 找不到对应handler处理: ${msg}`);
            return session.send({code: 500, error: '找不到对应的 handler'});
        }
        console.log(`${process.pid} 收到未知消息, ${msg}`);
        session.send({code: 500, error: '服务器收到未知消息'});
    }

    getScoketConnector(opts) {
        if (!opts.connector) return this._getDetaultScocketConnector();
        return this._getDetaultScocketConnector(); 
    }

    _getDetaultScocketConnector() {
        const WSConnector = require('./connector/ws.connector');
        return new WSConnector();
    }

    getChannel() {
        return this.channel;
    }
}

module.exports = App;


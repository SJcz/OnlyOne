import events from 'events';
import path from 'path';
import fs from 'fs';
import uuid from 'uuid';
import Chance from 'chance';

import redisService, { RedisService } from './redis/redisService';
import channelService, { ChannelService } from './channel/channelService';
import WSConnector from './connector/ws.connector';
import WSSession from './connector/ws.session';
import { IBasicMessage, IPushMessage, IRedisChannelMessage, IRequestMessage, IStartOptions, IUser } from './define/interface/common';
import { ProcessMessageRoute, RedisMessageRoute } from './define/interface/constant';
const chance = new Chance();

interface IHandlerMap {
    [handlerName: string]: {
        // eslint-disable-next-line @typescript-eslint/ban-types
        [method: string]: Function;
    } & {
        filePath: string,
        methodList: string[],
        name: string,
    }
}


class App extends events.EventEmitter {
    handlers!: IHandlerMap;
    allRoomUserNum!: { [roomId: string]: number };

    channelService!: ChannelService;
    connector!: WSConnector;
    redisService!: RedisService;

    sessionList!: { [sessionId: string]: WSSession };

    start(opts: IStartOptions) {
        opts = opts || {};
        this.handlers = {};
        this.allRoomUserNum = {};
        this.connector = this.getScoketConnector(opts);
        this.connector.start(opts);
        this.sessionList = {};
        this.redisService = redisService(this);
        this._initEvents();
        this._initProcessEvents();
        this._initHandlers();
        this._initChannelService();
        setInterval(() => {
            const userIds = Object.values(this.sessionList).map(session => session.userId);
            const memoryUsage = process.memoryUsage();
            const [heapTotal, heapUsed, rss] = [Math.trunc(memoryUsage.heapTotal / 1024 / 1024), Math.trunc(memoryUsage.heapUsed / 1024 / 1024), Math.trunc(memoryUsage.rss / 1024 / 1024)]
            console.log(`进程 ${process.pid} 当前维持了 ${userIds.length} 个连接, 当前申请内存=${heapTotal} M  使用内存=${heapUsed} M , rss =${rss} M`);
            if (process.send) {
                process.send({
                    type: 'push',
                    route: ProcessMessageRoute.OOM_PEOPLE_NUM_REPORT,
                    data: this.channelService.getAllChannelUserNum()
                })
                process.send({
                    type: 'pull',
                    route: ProcessMessageRoute.ROOM_PEOPLE_NUM,
                    data: null
                })
            }
        }, 5000);
    }

    _initEvents() {
        this.connector.on("connection", this.handleConnection.bind(this));
        this.on('channel', (message: IRedisChannelMessage) => {
            if ([RedisMessageRoute.ROOM_CHAT, RedisMessageRoute.ROOM_JOIN, RedisMessageRoute.ROOM_LEAVE].includes(message.route as RedisMessageRoute)) {
                const channel = this.channelService.getChannel(message.data.room_id);
                if (channel) channel.pushMessage(<IPushMessage>message);
            }
        });
    }

    _initProcessEvents() {
        process.on('message', (message: IBasicMessage) => {
            if (message.type == 'push') {
                if ((<IPushMessage>message).route == ProcessMessageRoute.ROOM_PEOPLE_NUM) {
                    this.allRoomUserNum = <{ [roomId: string]: number }>message.data;
                }
            }
        });
    }

    _initHandlers() {
        const scanFiles = this._scanHandlerFolder();
        this._generateHandlerMethodMap(scanFiles);
    }

    _initChannelService() {
        this.channelService = channelService(this);
    }

    _scanHandlerFolder(): string[] {
        const dirPath = path.join(process.cwd(), './lib/handler');
        const files = fs.readdirSync(dirPath);
        return files.map(file => {
            const filePath = path.resolve(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && /\.(js)|(jsx)/.test(path.extname(file))) return filePath;
        }).filter(file => !!file) as string[];
    }

    _generateHandlerMethodMap(scanFiles: string[]) {
        if (scanFiles.length === 0) {
            console.warn('there is no any handler file provide');
        }
        for (const filePath of scanFiles) {
            const handlerName = path.basename(filePath).replace(/\.(js)|(jsx)$/, '');

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            let handlerObj = require(filePath);
            if (typeof handlerObj !== 'function') continue;
            handlerObj = handlerObj(this);
            Object.assign(handlerObj, {
                filePath: filePath,
                methodList: [],
                name: handlerName,
            });
            this.handlers[handlerName] = handlerObj;

            for (const methodName in handlerObj) {
                if (typeof handlerObj[methodName] === 'function') {
                    this.handlers[handlerName].methodList.push(methodName);
                }
            }
        }
    }

    handleConnection(session: WSSession) {
        this.sessionList[session.id] = session;
        // 因为不需要登录, 所以连接上直接给一个用户Id
        const userId = uuid.v1();
        const user: IUser = {
            userId,
            avatar: chance.avatar(),
            username: chance.name()
        }
        session.set('userId', userId);
        session.set('user', user);
        session.on('message', this.handleMessage.bind(this, session));
        session.on('error', (error) => {
            console.log(error);
        });
        session.on('close', () => {
            delete this.sessionList[session.id];
            this.channelService.leave(session.userId);
        });
    }

    // msg { route, data, requestId }
    async handleMessage(session: WSSession, msg: IRequestMessage) {
        console.log(`收到 ${session.userId} 的消息: ${JSON.stringify(msg)}`);
        if (!msg.route) {
            console.log(`消息 route=${msg.route} 路由无效, 未知消息不处理`);
            if (msg.type === 'request') session.send(<IBasicMessage>{ type: 'response', code: 501, data: '服务器收到未知消息', requestId: msg.requestId });
            return;
        }
        const [handlerName, method] = msg.route.split('.');
        if (!this.handlers[handlerName] || typeof this.handlers[handlerName][method] !== 'function') {
            console.log(`找不到 handlerName=${handlerName} method=${method} 来处理该消息`);
            if (msg.type === 'request') session.send(<IBasicMessage>{ type: 'response', code: 404, data: '找不到对应的 handler', requestId: msg.requestId });
            return;
        }
        try {
            const result = await this.handlers[handlerName][method](msg.data || {}, session);
            if (msg.type == 'request') return session.send(<IBasicMessage>{ type: 'response', code: 0, data: result, requestId: msg.requestId });
        } catch (err) {
            console.error(err);
            if (msg.type == 'request') return session.send(<IBasicMessage>{ type: 'response', code: 500, data: '服务器错误', requestId: msg.requestId });
        }
    }

    getScoketConnector(opts: IStartOptions) {
        if (!opts.connector) return this._getDetaultScocketConnector();
        return this._getDetaultScocketConnector();
    }

    _getDetaultScocketConnector() {
        return new WSConnector();
    }

    get(key: 'channelService' | 'sessionList' | 'allRoomUserNum') {
        switch (key) {
            case 'channelService':
                return this.channelService;
            case 'sessionList':
                return this.sessionList;
            case 'allRoomUserNum':
                return this.allRoomUserNum;
            default:
                throw new Error(`app 不能获取 ${key}`)
        }
    }
}

export = App;



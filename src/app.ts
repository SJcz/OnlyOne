import events from 'events'
import { v1 } from 'uuid'
import Chance from 'chance'
import WSConnector from './connector/ws.connector'
import WSSession from './connector/ws.session'
import { IHandlerMap, IStartOptions, IRedisChannelMessage, IPushMessage, IUser, IRequestMessage, IBasicMessage } from './define/interface/common'
import { RedisMessageRoute } from './define/interface/constant'
import initChannelService, { ChannelService } from './service/channelService'
import initRedisService, { RedisService } from './service/redisService'
import AppUtil from './util/appUtil'
import initProcessService, { ProcessService } from './service/processService'

const chance = new Chance()

class App extends events.EventEmitter {
	handlerMap!: IHandlerMap;
	channelService!: ChannelService;
	connector!: WSConnector;
	redisService!: RedisService;
	processService!: ProcessService

	clientSessionList!: { [sessionId: string]: WSSession };

	start(opts: IStartOptions) {
		opts = opts || {}
		this.connector = this.getScoketConnector(opts)
		this.connector.start(opts)

		this.clientSessionList = {}

		this.processService = initProcessService(this)
		this.redisService = initRedisService(this)
		this.channelService = initChannelService(this)

		AppUtil.initHandlerMap(this)

		this._initEvents()
	}

	_initEvents() {
		this.connector.on('connection', this.handleConnection.bind(this))
		this.on('channel', (message: IRedisChannelMessage) => {
			if ([RedisMessageRoute.ROOM_CHAT, RedisMessageRoute.ROOM_JOIN, RedisMessageRoute.ROOM_LEAVE].includes(message.route as RedisMessageRoute)) {
				const channel = this.channelService.getChannel(message.data.room_id)
				if (channel) channel.pushMessage(<IPushMessage>message)
			}
		})
	}

	handleConnection(session: WSSession) {
		this.clientSessionList[session.id] = session
		// 因为不需要登录, 所以连接上直接给一个用户Id
		const userId = v1()
		const user: IUser = {
			userId,
			avatar: chance.avatar(),
			username: chance.name()
		}
		session.set('userId', userId)
		session.set('user', user)
		session.on('message', this.handleClientMessage.bind(this, session))
		session.on('error', (error) => {
			console.error(error)
			delete this.clientSessionList[session.id]
			this.channelService.leave(session.userId)
		})
		session.on('close', (code: number, reason: string) => {
			console.log(`sessionId=${session.id} closed: code=${code}, reason=${reason}`)
			delete this.clientSessionList[session.id]
			this.channelService.leave(session.userId)
		})
	}

	// msg { route, data, requestId }
	async handleClientMessage(session: WSSession, msg: IRequestMessage) {
		console.log(`收到 ${session.userId} 的消息: ${JSON.stringify(msg)}`)
		if (!msg.route) {
			console.log(`消息 route=${msg.route} 路由无效, 未知消息不处理`)
			if (msg.type === 'request') session.send(<IBasicMessage>{ type: 'response', code: 501, data: '服务器收到未知消息', requestId: msg.requestId })
			return
		}
		const [handlerName, method] = msg.route.split('.')
		if (!this.handlerMap[handlerName] || typeof this.handlerMap[handlerName][method] !== 'function') {
			console.log(`找不到 handlerName=${handlerName} method=${method} 来处理该消息`)
			if (msg.type === 'request') session.send(<IBasicMessage>{ type: 'response', code: 404, data: '找不到对应的 handler', requestId: msg.requestId })
			return
		}
		try {
			const result = await this.handlerMap[handlerName][method](msg.data || {}, session)
			if (msg.type == 'request') return session.send(<IBasicMessage>{ type: 'response', code: 0, data: result, requestId: msg.requestId })
		} catch (err) {
			console.error(err)
			if (msg.type == 'request') return session.send(<IBasicMessage>{ type: 'response', code: 500, data: '服务器错误', requestId: msg.requestId })
		}
	}

	getScoketConnector(opts: IStartOptions) {
		if (!opts.connector) return this._getDetaultScocketConnector()
		return this._getDetaultScocketConnector()
	}

	_getDetaultScocketConnector() {
		return new WSConnector()
	}

	get(key: 'channelService' | 'clientSessionList') {
		switch (key) {
			case 'channelService':
			case 'clientSessionList':
				return this[key]
			default:
				throw new Error(`app 不能获取 ${key}`)
		}
	}
}

export default App



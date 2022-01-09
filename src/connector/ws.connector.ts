import WebSocket from 'ws'
import events from 'events'
import WSSession from './ws.session'
import { IStartOptions } from '../define/interface/common'
import log4js from 'log4js'
const logger = log4js.getLogger()

let curIndex = 1

export default class WSConnector extends events.EventEmitter {
	wss!: WebSocket.Server;
	clientSessionList: { [sessionId: string]: WSSession } = {}
	timer!: NodeJS.Timeout
	constructor() {
		super()
	}
	start(opts: IStartOptions) {
		this.wss = new WebSocket.Server({ port: opts.port, maxPayload: 10 * 1024 }, () => {
			logger.info(`connector process ${process.pid} is running with 'WebSocket:${opts.port}'`)
		})
		this._initEvents()
		this.heartCheck()
	}

	_initEvents() {
		this.wss.on('connection', (socket: WebSocket) => {
			const session = new WSSession(curIndex++, socket)
			this.clientSessionList[session.id] = session
			session.on('error', (error) => {
				logger.error(error)
				logger.info(`sessionId=${session.id} userId=${session.userId} error: error=${error.message}`)
				delete this.clientSessionList[session.id]
				session.emit('connect-error')
			})
			session.on('close', (code: number, reason: string) => {
				logger.info(`sessionId=${session.id} userId=${session.userId} closed: code=${code}, reason=${reason}`)
				delete this.clientSessionList[session.id]
				session.emit('connect-error')
			})
			this.emit('connection', session)
		})
	}

	close(cb?: () => void) {
		this.wss && this.wss.close(cb)
	}

	heartCheck() {
		this.timer && clearInterval(this.timer)
		this.timer = setInterval(() => {
			for (const sessionId in this.clientSessionList) {
				const session = this.clientSessionList[sessionId]
				if (session.isAlive === false) session.terminate()
				session.isAlive = false
				session.ping()
			}
		}, 30000)
	}
}



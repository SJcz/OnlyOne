import WebSocket from 'ws'
import events from 'events'
import WSSession from './ws.session'
import { IStartOptions } from '../define/interface/common'

let curIndex = 1

export default class WSConnector extends events.EventEmitter {
	wss!: WebSocket.Server;
	constructor() {
		super()
	}
	start(opts: IStartOptions) {
		this.wss = new WebSocket.Server({ port: opts.port, maxPayload: 10 * 1024 }, () => {
			console.log(`connector process ${process.pid} is running with 'WebSocket:${opts.port}'`)
		})
		this._initEvents()
	}

	_initEvents() {
		this.wss.on('connection', (socket: WebSocket) => {
			const session = new WSSession(curIndex++, socket)
			this.emit('connection', session)
		})
	}

	close(cb?: () => void) {
		this.wss && this.wss.close(cb)
	}
}



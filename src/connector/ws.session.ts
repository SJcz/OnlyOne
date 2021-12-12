import events from 'events'
import WebSocket from 'ws'
import { IBasicMessage, IUser } from '../define/interface/common'

const ST_INITED = 0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ST_CLOSED = 1

export default class WSSession extends events.EventEmitter {
	id: number;
	socket: WebSocket;
	state: number;

	map: Map<string, unknown>;

	constructor(id: number, socket: WebSocket) {
		super()
		this.id = id
		this.socket = socket
		this.state = ST_INITED
		this.map = new Map()
		this._initEvents()
	}

	_initEvents() {
		this.socket.on('message', (message) => {
			this.emit('message', JSON.parse(message.toString()))
		})
		this.socket.on('close', this.emit.bind(this, 'close'))
		this.socket.on('error', this.emit.bind(this, 'error'))
	}

	send(msg: IBasicMessage | string) {
		if (this.state !== ST_INITED) return
		if (typeof msg !== 'string') msg = JSON.stringify(msg)
		this.socket.send(msg)
	}

	set(key: string, value: unknown) {
		this.map.set(key, value)
	}

	get<T>(key: string): T {
		return this.map.get(key) as T
	}

	get userId(): string {
		return this.map.get('userId') as string
	}

	get user(): IUser {
		return this.map.get('user') as IUser
	}
}



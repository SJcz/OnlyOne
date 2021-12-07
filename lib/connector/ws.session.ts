import events from 'events'
import WebSocket from 'ws'

const ST_INITED = 0;
const ST_CLOSED = 1;

export default class WSSession extends events.EventEmitter {
    id: number;
    socket: WebSocket;
    state: number;
    [property: string]: any;
    constructor(id: number, socket: WebSocket) {
        super();
        this.id = id;
        this.socket = socket;
        this.state = ST_INITED;
        this._initEvents();
    }

    _initEvents() {
        this.socket.on('message', (message) => {
            this.emit('message', JSON.parse(message.toString()));
        });
        this.socket.on('close', this.emit.bind(this, 'close'));
        this.socket.on('error', this.emit.bind(this, 'error'));
    }

    send(msg: string) {
        if (this.state !== ST_INITED) return;
        if (typeof msg !== 'string') msg = JSON.stringify(msg);
        this.socket.send(msg);
    }

    set(key: string, value: any) {
        this[key] = value;
    }
}



import WebSocket from 'ws'
import events from 'events'
import WSSession from './ws.session'

let curIndex = 1;

export default class WSConnector extends events.EventEmitter {
    wss!: WebSocket.Server;
    constructor() {
        super();
    }
    start(opts: any) {
        this.wss = new WebSocket.Server({ port: opts.port, maxPayload: 1000 }, () => {
            console.log(`connector process ${process.pid} is running with 'WebSocket:${opts.port}'`)
        });
        this._initEvents();
    }

    _initEvents() {
        this.wss.on('connection', (socket: WebSocket) => {
            const session = new WSSession(curIndex++, socket);
            this.emit('connection', session);
        });
    }
}



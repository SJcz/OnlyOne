const WebSocket = require('ws');
const WSSession = require('./ws.session');
const events = require('events');

let curIndex = 1;

class WSConnector extends events.EventEmitter {
    constructor() {
        super();
    }
    start(opts) {
        this.wss = new WebSocket.Server({ port: opts.port, maxPayload: 1000 }, () => {
            console.log(`connector process ${process.pid} is running with 'WebSocket:${opts.port}'`)
        });
        this._initEvents();
    }

    _initEvents() {
        this.wss.on('connection', socket => {
            const session = new WSSession(curIndex++, socket);
            this.emit('connection', session);
        });
    }
}

module.exports = WSConnector;



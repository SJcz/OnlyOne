const events = require('events');

const ST_INITED = 0;
const ST_CLOSED = 1;

class WSSession extends events.EventEmitter {
    constructor(id, socket) {
        super();
        this.id = id;
        this.socket = socket;
        this.state = ST_INITED;
        this._initEvents();
    }

    _initEvents() {
        this.socket.on('message', (message) => {
            this.emit('message', JSON.parse(message));
        });
        this.socket.on('close', this.emit.bind(this, 'close')); 
        this.socket.on('error', this.emit.bind(this, 'error')); 
    }

    send(msg) {
        if (this.state !== ST_INITED) return;
        if (typeof msg !== 'string') msg = JSON.stringify(msg);
        this.socket.send(msg);
    }

    set(key, value) {
        this[key] = value;
    }
}

module.exports = WSSession;



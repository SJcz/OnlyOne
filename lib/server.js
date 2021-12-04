const cluster = require('cluster');
const os = require('os');
require('dotenv').config();


if (cluster.isMaster) {
    const processRoomPropleNum = {}
    const cpus = os.cpus();
    for (let i = 0; i < cpus.length; i++) {
        const worker = cluster.fork();
        processRoomPropleNum[worker.process.pid] = {};
        worker.on('message', (message) => {
            console.log(`主进程:`)
            console.log(processRoomPropleNum);
            if (message.type == 'push') {
                if (message.route == 'room.people.num.report') {
                    for (let name in message.data) {
                        processRoomPropleNum[worker.process.pid][name] = message.data[name] || 0;
                    }
                }
            }
            if (message.type == 'pull') {
                if (message.route == 'room.people.num') {
                    worker.send({
                        type: 'push',
                        route: 'room.people.num',
                        data: Object.values(processRoomPropleNum)
                    });
                }
            }
        });
    }
} else {
    const App = require('./app');
    new App().start({ port: process.env.WS_PORT || 9090 });
}


import cluster from 'cluster'
import os from 'os'
import dotenv from 'dotenv';
import App from './app';
dotenv.config();

interface IProcessRoomPeopleNum {
    [pid: number]: {
        [name: string]: number
    }
}

if (cluster.isPrimary) {
    const processRoomPropleNum: IProcessRoomPeopleNum = {}
    const cpus = os.cpus();
    for (let i = 0; i < cpus.length; i++) {
        const worker = cluster.fork();
        if (worker.process.pid) processRoomPropleNum[worker.process.pid] = {};
        worker.on('message', (message) => {
            if (message.type == 'push') {
                if (message.route == 'room.people.num.report') {
                    for (let name in message.data) {
                        if (worker.process.pid) {
                            processRoomPropleNum[worker.process.pid][name] = message.data[name] || 0;
                        }
                        
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
            if (message.type == 'request') {
                if (message.route == 'room.people.num') {
                    worker.process
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
    new App().start({ port: process.env.WS_PORT || 9090 });
}


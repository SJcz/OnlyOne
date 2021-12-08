import cluster from 'cluster'
import os from 'os'
import dotenv from 'dotenv';
import App from './app';
import { IBasicMessage, IPushMessage, IRequestMessage, IRoomUserNum } from './define/interface/common';
import { ProcessMessageRoute } from './define/interface/constant';
dotenv.config();

interface IProcessRoomUserNum {
    [pid: number]: IRoomUserNum
}


if (cluster.isPrimary) {
    const processRoomPropleNum: IProcessRoomUserNum = {}
    const cpus = os.cpus();
    for (let i = 0; i < cpus.length; i++) {
        const worker = cluster.fork();
        if (worker.process.pid) processRoomPropleNum[worker.process.pid] = {};
        worker.on('message', (message: IBasicMessage) => {
            if (message.type == 'push') {
                if ((<IPushMessage>message).route == ProcessMessageRoute.OOM_PEOPLE_NUM_REPORT) {
                    for (const name in <IRoomUserNum>message.data) {
                        if (worker.process.pid) {
                            processRoomPropleNum[worker.process.pid][name] = (<IRoomUserNum>message.data)[name] || 0;
                        }
                    }
                }
            }
            if (message.type == 'pull') {
                if ((<IPushMessage>message).route == ProcessMessageRoute.ROOM_PEOPLE_NUM) {
                    worker.send({
                        type: 'push',
                        route: ProcessMessageRoute.ROOM_PEOPLE_NUM,
                        data: mergeRoomPeopleNum(Object.values(processRoomPropleNum))
                    });
                }
            }
            if (message.type == 'request') {
                if ((<IRequestMessage>message).route == ProcessMessageRoute.ROOM_PEOPLE_NUM) {
                    worker.send({
                        type: 'push',
                        route: ProcessMessageRoute.ROOM_PEOPLE_NUM,
                        data: Object.values(processRoomPropleNum)
                    });
                }
            }
        });
    }
} else {
    new App().start({ port: Number(process.env.WS_PORT) || 9090 });
}

function mergeRoomPeopleNum(objArr: IRoomUserNum[]): IRoomUserNum {
    const returnObj: IRoomUserNum = {};
    for (const obj of objArr) {
        for (const key in obj) {
            if (!returnObj[key]) returnObj[key] = 0;
            returnObj[key] += obj[key];
        }
    }
    return returnObj;
}


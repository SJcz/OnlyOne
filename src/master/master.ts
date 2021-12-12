import cluster, { Worker } from 'cluster'
import os from 'os'
import { IBasicMessage, IPushMessage, IRoomUserNum } from '../define/interface/common'
import { ProcessMessageRoute } from '../define/interface/constant'
import roomManager from '../manager/roomManager'

class Master {
	workers!: { [id: number]: Worker }

	start() {
		this.workers = {}
		this.initProcessEvent()
		this.startAllWorkers()
	}

	initProcessEvent() {
		process.on('exit', () => {
			for (const id in this.workers) {
				this.workers[id].kill()
			}
		})
	}

	startAllWorkers() {
		const cpus = os.cpus()
		const minWorkerNum = cpus.length - 2 <= 1 ? 1 : cpus.length - 2
		for (let i = 0; i < minWorkerNum; i++) {
			this.createWorker()
		}
	}

	createWorker() {
		const worker = cluster.fork()
		worker.on('exit', (code: number, signal: string) => {
			console.log(`worker ${worker.id}, process ${worker.process.pid} exit. code=${code} signal=${signal}`)
			delete this.workers[worker.id]
			this.createWorker()
		})
		worker.on('error', (error: Error) => {
			console.log(`worker ${worker.id}, process ${worker.process.pid} error`)
			console.error(error)
		})
		worker.on('message', (message: IBasicMessage) => {
			if (message.type == 'push') {
				switch ((<IPushMessage>message).route) {
					case ProcessMessageRoute.ROOM_PEOPLE_NUM_REPORT:
						return this.handlerPushMessage_ROOM_PEOPLE_NUM_REPORT(worker.process.pid, <IPushMessage>message)
					default:
						return this.handlerPushMessage_NO_MATCH(worker.process.pid, <IPushMessage>message)
				}
			}
			if (message.type == 'pull') {
				if ((<IPushMessage>message).route == ProcessMessageRoute.ROOM_PEOPLE_NUM) {
					worker.send({
						type: 'push',
						route: ProcessMessageRoute.ROOM_PEOPLE_NUM,
						data: roomManager.countAllProcessRoomUserNum()
					})
				}
			}
		})
		this.workers[worker.id] = worker
		console.log(`create worker ${worker.id}, process ${worker.process.pid} successfully!`)
	}

	handlerPushMessage_ROOM_PEOPLE_NUM_REPORT(pid: number, message: IPushMessage) {
		roomManager.updateProcessRoomUserNum(pid, <IRoomUserNum>message.data)
	}

	handlerPushMessage_NO_MATCH(pid: number, message: IPushMessage) {
		console.error(`主进程 收到无法处理的子进程消息, route=${message.route}， 子进程PID=${pid}`)
	}
}

export default Master
import App from '../app'
import WSSession from '../connector/ws.session'
import { RedisMessageRoute } from '../define/interface/constant'
import roomManager from '../manager/roomManager'
import { ChannelService } from '../service/channelService'
import os from 'os'

let startUsage = process.cpuUsage()

class RoomHandler {
	app: App;
	constructor(app: App) {
		this.app = app
	}
	getRoomList() {
		return ['onlyOne']
	}

	joinRoom({ room_id }: IJoinRoomRequestBody, session: WSSession) {
		if (room_id !== 'onlyOne') throw new Error('只能进入 onlyOne 房间')
		const channelService = this.app.get('channelService') as ChannelService
		const channel = channelService.getChannel(room_id, true)
		channel.add({ ...session.user, sessionId: session.id })
		this.app.redisService.publish('channel', { route: RedisMessageRoute.ROOM_JOIN, data: { room_id, user: session.user } })

		return {
			room_id,
			user: session.user
		}
	}

	leaveRoom({ room_id }: ILeaveRoomRequestBody, session: WSSession) {
		const channelService = this.app.get('channelService') as ChannelService
		const channel = channelService.getChannel(room_id)
		if (!channel) return
		channel.leave(session.userId)
		this.app.redisService.publish('channel', { route: RedisMessageRoute.ROOM_LEAVE, data: { room_id, user: session.user } })
		return 'ok'
	}

	getRoomInfo({ room_id }: IGetRoomAllUserNumRequestBody) {
		const cpus = os.cpus()
		const memoryUsage = process.memoryUsage()
		const [heapTotal, heapUsed, rss] = [
			memoryUsage.heapTotal / 1024 / 1024,
			memoryUsage.heapUsed / 1024 / 1024,
			memoryUsage.rss / 1024 / 1024
		]
		startUsage = process.cpuUsage(startUsage)
		return {
			room_user_count: roomManager.getRoomPropleNum(room_id),
			system_info: {
				process: {
					worker_num: cpus.length - 1 <= 1 ? 1 : cpus.length - 1,
					process_id: process.pid,
					process_session_num: Object.values(this.app.clientSessionList).length,
				},
				memory: {
					heapTotal: heapTotal.toFixed(2),
					heapUsed: heapUsed.toFixed(2),
					rss: rss.toFixed(2)
				},
				cpu_usage: {
					user: (startUsage.user / 1000).toFixed(2),
					system: (startUsage.system / 1000).toFixed(2),
				}
			}
		}
	}
}

interface IJoinRoomRequestBody {
	room_id: string;
}

interface ILeaveRoomRequestBody {
	room_id: string;
}

interface IGetRoomAllUserNumRequestBody {
	room_id: string;
}

export = (app: App) => {
	return new RoomHandler(app)
};



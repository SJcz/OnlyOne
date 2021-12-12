import { IRoomUserNum } from '../define/interface/common'

/**房间管理, 记录每个房间分布在全部进程的总人数 */
class RoomManager {
	allRoomUserNum: IRoomUserNum
	processRoomUserNum: {
		[pid: number]: IRoomUserNum
	}
	constructor() {
		this.allRoomUserNum = {}
		this.processRoomUserNum = {}
	}

	updateAllRoomUserNum(data: IRoomUserNum) {
		this.allRoomUserNum = data
	}

	/**
	 * 获取某个房间的人数分布(所有进程)
	 * @param room_id 
	 */
	getRoomPropleNum(room_id: string) {
		return this.allRoomUserNum[room_id] || 0
	}

	/**更新某个进程的房间人数分布 */
	updateProcessRoomUserNum(pid: number, data: IRoomUserNum) {
		this.processRoomUserNum[pid] = data
	}

	/**统计所有进程中房间人数分布, 得到整合后的结果 */
	countAllProcessRoomUserNum() {
		return mergeRoomPeopleNum(Object.values(this.processRoomUserNum))
	}
}


function mergeRoomPeopleNum(objArr: IRoomUserNum[]): IRoomUserNum {
	const returnObj: IRoomUserNum = {}
	for (const obj of objArr) {
		for (const key in obj) {
			if (!returnObj[key]) returnObj[key] = 0
			returnObj[key] += obj[key]
		}
	}
	return returnObj
}

const roomManager = new RoomManager()
export default roomManager
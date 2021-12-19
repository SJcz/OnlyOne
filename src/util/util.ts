import fs from 'fs-extra'
import { AVATAR_BASE_FOLDER } from '../define/interface/constant'


/**获得一个随机头像 */
export async function getRandomAvatar() {
	const files = await fs.readdir(AVATAR_BASE_FOLDER)
	const index = Math.floor(Math.random() * files.length)
	return process.env.HTTP_DOMAIN + `/avatar/${files[index]}`
}
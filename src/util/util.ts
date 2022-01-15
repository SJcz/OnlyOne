import fs from 'fs-extra'
import crypto = require('crypto')
import { AVATAR_BASE_FOLDER } from '../define/interface/constant'

/**获得一个随机头像 */
export async function getRandomAvatar() {
	const files = await fs.readdir(AVATAR_BASE_FOLDER)
	const index = Math.floor(Math.random() * files.length)
	return process.env.HTTP_DOMAIN + `/avatar/${files[index]}`
}

export function decryptToken(token: string): string {
	const decipher = crypto.createDecipheriv('aes-128-ecb', process.env.SECRET_KEY as string, '')
	let decrypted = decipher.update(Buffer.from(token, 'base64').toString('hex'), 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	return decrypted
}
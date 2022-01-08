import express, { Express } from 'express'
import fs from 'fs-extra'
import { AVATAR_BASE_FOLDER } from '../define/interface/constant'
import log4js from 'log4js'
const logger = log4js.getLogger()

export default class HttpServer {
  private app!: Express;
  start() {
  	fs.ensureDirSync(AVATAR_BASE_FOLDER)
		
  	this.app = express()
  	// 建立静态资源服务
  	this.app.use('/avatar', express.static(AVATAR_BASE_FOLDER))
  	// 处理浏览器 /favicon.ico 请求
  	this.app.get('/favicon.ico', (req, res) => res.end('favicon.ico'))
  	this.app.listen(process.env.HTTP_PORT, () => {
  		logger.info(`静态资源服务器启动 PROT=${process.env.HTTP_PORT}, 资源目录: ${AVATAR_BASE_FOLDER}`)
  	})
  }
}
# OnlyOne
一个随时随地可加入的聊天室

demo: 开发中

## 介绍
一个立志于实现超多用户同时在线和聊天的聊天室, 只有一个房间, 随时随地均可加入

## 1.X 版本
### 功能点
- [x] 用户 - 进入聊天室
- [x] 用户 - 发送消息
- [x] 用户 - 接收消息
- [x] 用户 - 离开聊天室

## 技术栈
- ~~javascript~~ 
- Typescript
- Docker
- websocket & cluster
- redis

## 架构图
![image](https://user-images.githubusercontent.com/20878022/144744803-610525ca-d672-4a84-91e0-237dd5ed324d.png)
解析:  
- chat server 使用 cluster 创建多个连接子进程
- 客户端通过 websocket 和 chat server 的连接进程保持长连接

## 项目运行
```javascript
npm i // 安装所依赖的模块

npm run start // 启动项目
```

## 项目依赖
### redis
当前项目使用的 redis 的 sub/push 来代替进程间的业务通讯.

### ws
项目使用 ws 模块启动 websocket 服务器

### .env
项目配置文件, 配置 ws 端口及 redis 地址

## Docker
若想使用 docker 部署项目, 需要先拉取项目的 docker 镜像
```
docker pull 626040875/onlyone_server:1.1.0
```
然后拉取某版本的 redis 镜像
```
docker pull redis:6.2.6
```
启动 redis 容器
```
docker run -d -p 6379  --name redis redis:6.2.6
```
启动 onlyne_server容器
```
docker run -d -p 9090 --link redis:redis   --name onlyone_server 626040875/onlyone_server:1.1.0
```

## 消息体数据结构
### 客户端发送【请求消息】到服务端, 要求服务器响应该消息( 基于 tcp 连接)
```javascript
{
    requestId: number，// 请求ID
    type: string, // 消息类型, 对于请求类的消息, type=request
    route: string, // 请求的路由  服务器根据路由来处理该请求
    data: any, // 实际的请求参数
}
```

### 服务器返回【响应消息】到客户端(基于 tcp 连接)
```javascript
{
    requestId: number，// 请求消息里面的请求ID
    type: string, // 消息类型, 对于响应类的消息, type=response
    code: number, // 响应的错误码, 0表示正常响应, 其他表示非正常响应
    data: any, // 实际的响应数据, 当 code 不等于0 , 表示错误响应的原因.
}
```

### 服务器主动【推送消息】到客户端, 客户端主动【推送消息】到服务器, 不需要对方响应( 基于 tcp 连接)
```javascript

{
    type: string, // 消息类型, 对于推送类的消息, type=push
    route: string, // 推送的路由, 对方根据路由来处理该消息
    data: any, // 推送的数据
}
```

### 聊天消息-房间聊天 数据结构
```javascript
{
    room_id: string, // 聊天的房间ID
    sender: {
        userId: string, 发送者的用户id
        avatar: string, 发送者的头像
    },
    chat_message: {
        type: string, // 消息类型 文本=text 图片=picture 声音=voice
        path: string, // 图片或者声音的url路径
        content: string, // 文本的内容
    },
    send_time: number // 消息的发送时间
}
```

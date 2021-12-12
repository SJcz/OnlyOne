import WS from 'ws'

/**用于测试！！！！ */
function joinRoom(min: number, max: number) {
	for (let i = min; i < max; i++) {
		const client = new WS('ws://localhost:9090')
		let n = 1
		client.on('open', function open() {
			client.send(JSON.stringify({
				type: 'request',
				route: 'roomHandler.joinRoom',
				data: {
					room_id: 'onlyOne'
				}
			}))
			setInterval(() => {
				client.send(JSON.stringify({
					route: 'chatHandler.chat',
					data: {
						room_id: 'onlyOne',
						chat_message: {
							type: 'text',
							content: `我是客户端 name_${i} 大家好, 这是我发的第${n++}条消息`
						}
					}
				}))
			}, 5000)
		})
	}
}

let cur = 0

const interval = setInterval(() => {
	cur++
	if (cur >= 3) {
		clearInterval(interval)
	} else {
		joinRoom(200 * (cur - 1), 200 * cur)
	}
}, 2000)



// const client = new WS('ws://localhost:9090');
// client.on('open', function open() {
//     client.send(JSON.stringify({
//         route: 'roomHandler.joinRoom',
//         params: {
//             roomName: 'onlyOne'
//         }
//     }));
//     client.on('message', (message) => {
//         // console.log(String(message))
//     })
// });




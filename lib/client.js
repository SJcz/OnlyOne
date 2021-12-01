const WS = require('ws');

function joinRoom(min, max) {
    for (let i = min; i < max; i++) {
        const client = new WS('ws://localhost:8080');
        let n = 1;
        client.on('open', function open() {
            client.send(JSON.stringify({
                route: 'roomHandler.joinRoom',
                params: {
                    roomName: 'onlyOne'
                }
            }));
            setInterval(() => {
                client.send(JSON.stringify({
                    route: 'chatHandler.chat',
                    params: {
                        roomName: 'onlyOne',
                        content: `我是客户端 name_${i} 大家好, 这是我发的第${n++}条消息`
                    }
                }));
            }, 5000)
        });
    }
}

let cur = 0;

const interval = setInterval(() => {
    cur++;
    if (cur >= 3) {
        clearInterval(interval);
    } else {
        joinRoom(200 * (cur - 1), 200 * cur);
    }
}, 2000);



const client = new WS('ws://localhost:8080');
client.on('open', function open() {
    client.send(JSON.stringify({
        route: 'roomHandler.joinRoom',
        params: {
            roomName: 'onlyOne'
        }
    }));
    client.on('message', (message) => {
        // console.log(String(message))
    })
});




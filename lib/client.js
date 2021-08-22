const WS = require('ws');

for (let i = 0; i < 5; i++) {
    const client = new WS('ws://localhost:8080');
    client.on('open', function open() {
        client.send(JSON.stringify({
            route: 'roomHandler.joinRoom',
            params: {
                roomId: 'onlyOne'
            }
        }));
        setInterval(() => {
            client.send(JSON.stringify({
                route: 'chatHandler.chat',
                params: {
                    roomId: 'onlyOne',
                    content: `我是客户端 name_${i} 大家好`
                }
            }));
        }, 5000)
      });
    
      client.on('message', (ms) => {
          console.log(String(ms))
      })
}




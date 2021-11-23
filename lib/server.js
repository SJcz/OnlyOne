const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const cpus = os.cpus();
    for (let i = 0; i < 1; i++) {
        const worker = cluster.fork();
        worker.on('message', (message) => {
            console.log(`主进程收到子进程消息`)
        });
    }
} else {
    const App = require('./app');
    new App().start();
}


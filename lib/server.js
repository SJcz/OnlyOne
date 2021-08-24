const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const cpus = os.cpus();
    for (let i = 0; i < cpus.length; i++) {
        const worker = cluster.fork();
        worker.on('message', (message) => {
            if (message.type === 'push') {
                for (let id in cluster.workers) {
                    if (id !== worker.id) {
                        cluster.workers[id].send(message);
                    }
                }
            }
        });
    }
} else {
    const App = require('./app');
    new App().start();
}


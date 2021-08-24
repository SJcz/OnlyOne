module.exports = {
    notifyMainProcess(msg) {
        process.send({
            type: 'push',
            data: msg
        })
    }
}
const redis = require("redis");
const { promisify } = require("util");

class RedisService {
    constructor(app) {
        this.app = app;
        this.subscriber = redis.createClient({
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: process.env.REDIS_PORT || 6379,
        });
        this.publisher = redis.createClient({
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: process.env.REDIS_PORT || 6379,
        });
        this.getAsync = promisify(this.subscriber.get).bind(this.subscriber);
        this.setAsync = promisify(this.subscriber.set).bind(this.subscriber);
        this._initEvents();
    }

    _initEvents() {
        this.subscriber.subscribe('channel');
        this.subscriber.on('message', (category, message) => {
            if (category === 'channel') this.app.emit('channel', message);
        });
        this.subscriber.on('error', (error) => {
            console.error(error);
        })
    }

    publish(channel, msg) {
        this.publisher.publish(channel, JSON.stringify(msg));
    }
}

module.exports = (app) => {
    return new RedisService(app);
}
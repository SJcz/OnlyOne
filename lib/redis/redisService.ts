import App from "../app";

import redis from 'redis';
import { promisify } from 'util';

export class RedisService {
    app: App;
    subscriber: redis.RedisClient;
    publisher: redis.RedisClient;

    getAsync: (arg1: string) => Promise<string | null>;
    setAsync: (arg1: string, arg2: string) => Promise<unknown>;

    constructor(app: App) {
        this.app = app;
        this.subscriber = redis.createClient({
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: Number(process.env.REDIS_PORT) || 6379,
        });
        this.publisher = redis.createClient({
            host: process.env.REDIS_HOST || "127.0.0.1",
            port: Number(process.env.REDIS_PORT) || 6379,
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

    publish(channel: string, msg: any) {
        this.publisher.publish(channel, JSON.stringify(msg));
    }
}

export default (app: App) => {
    return new RedisService(app);
}
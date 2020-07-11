import Events = require('../events/events');
import { v4 as uuidv4 } from 'uuid';
import Database = require('../database/database');
import { Candle, Timestamp, Tick } from '../utils/types';
import * as _ from 'lodash';
import { cacheDb } from '../cache/cache';
import * as Binance from "./binance";
import { stringToTimeframe, FIVE_MINUTES } from '../utils/constants';

export interface CandleSubscription {
    timeframeName: string, 
    staleDuration: number,
    timeframe?: number,
    callback?: any,
    id?: string,
}

class Candles {
    private candleSubscriptions: CandleSubscription[];
    private mutexGuards: {}; // Make sure that we only atomically update db (maybe add in locking so we can wait for it and not have data loss?)

    constructor() {
        this.mutexGuards = {};
        this.candleSubscriptions = [];
    }

    start(candleSubscriptions: CandleSubscription[]) {
        console.log("Starting Candles");
        this.candleSubscriptions = candleSubscriptions;

        Events.on('NEW_TICK', async (tick: Tick) => {
            const cacheRes: any = await this.buildCandle(tick);
            if (cacheRes.isNewCandle) {
                this.handleNewCandle(cacheRes.candle, tick);
            }
        });
    }

    // Build a 5 min candle using redis as a cache to maintain the state
    buildCandle(tick: Tick) {
        return new Promise(resolve => {
            const cacheName = `buildCandle:${tick.name}:${tick.exchange}:${tick.pair}`;
            if (!this.mutexGuards[cacheName]) { // Data loss here is ok. We don't want to have a backlog and overflow the stack
                this.mutexGuards[cacheName] = true;
                cacheDb.get(cacheName, async (err, cacheItem) => {
                    if (err) throw new Error(err);
                    let isNewCandle = false;
                    const existingCandle: Candle = _.cloneDeep(JSON.parse(cacheItem)); // _.cloneDeep here just as a sanity check...
    
                    const currentCandleOpenTimestamp = Math.floor(Date.now() / FIVE_MINUTES) * FIVE_MINUTES;
                    if (existingCandle?.openTimestamp === currentCandleOpenTimestamp) {
                        existingCandle.volume += tick.volume;
                        existingCandle.high = Math.max(existingCandle.high, tick.price);
                        existingCandle.low = Math.min(existingCandle.low, tick.price);
                        existingCandle.close = tick.price;                
    
                        cacheDb.set(cacheName, JSON.stringify(existingCandle), (err, res) => {
                            if (err) throw new Error(err);
                        });
                    } else {
                        // Insert a newCandle since the old one is now invalidated or it didn't exist
                        const newCandle = {
                            high: tick.price,
                            low: tick.price,
                            open: tick.price,
                            close: tick.price,
                            openTimestamp: currentCandleOpenTimestamp,
                            volume: tick.volume,
                        }
    
                        isNewCandle = true;
                        cacheDb.set(cacheName, JSON.stringify(newCandle), (err, res) => {
                            if (err) throw new Error(err);
                        });
                    }

                    this.mutexGuards[cacheName] = false;
                    return resolve({ candle: existingCandle, isNewCandle }); // resolve() previously generated candle now that it has passed the timerange
                });
            }
        });
    }

    handleNewCandle(candle: Candle, tick: Tick) {
        const { pair, name, exchange, symbol } = tick;
        const promises = this.candleSubscriptions.map(async subscription => {
            const candleCollName = `${name}:${pair}:${subscription.timeframeName}:${subscription.staleDuration}:${exchange}`;
            const candleColl = await Database.dbReference.candlesDb.collection(candleCollName);

            const lastCandle = (await candleColl.find().sort({ openTimestamp: -1 }).limit(1).toArray()).last();
            const candleOpenTimestamp = Math.floor(candle.openTimestamp / subscription.timeframe) * subscription.timeframe;
            if (candleOpenTimestamp === lastCandle?.openTimestamp) {
                await candleColl.updateOne({ ...lastCandle }, {
                    "$set": {
                        high: Math.max(lastCandle.high, candle.high),
                        low: Math.min(lastCandle.low, candle.low),
                        close: candle.close,
                        volume: lastCandle.volume + candle.volume,
                    }
                });
            } else {
                const newCandle = {
                    ...candle,
                    openTimestamp: candleOpenTimestamp,
                };
                await candleColl.insertOne(newCandle);  
                
                const deleteQuery = { openTimestamp: { "$lte":  candle.openTimestamp - subscription.staleDuration }};
                const expiredCandles = await candleColl.find(deleteQuery).toArray();
                await candleColl.deleteMany(deleteQuery);

                Events.emit(`NEW_CANDLE:${subscription.timeframeName}:${subscription.staleDuration}`, {
                    candle: lastCandle,
                    expiredCandles,
                    candleCollName,
                    pair,
                    name,
                    symbol,
                    exchange
                });
            }
        });

        return Promise.all(promises);
    }

    /**
     * Subscribe to a given candle timeframe (will write candles to the given db and call the callback on new candle)
     * @param {CandleSubscription} subscription 
     */
    subscribe(subscription: CandleSubscription, callback) {
        const id = uuidv4();
        this.candleSubscriptions.push({ ...subscription, id, callback });

        return () => this.candleSubscriptions = this.candleSubscriptions.filter(x => x.id !== id);
    }
}

/**
 * Get the correct candle stream for a pair depending on the exchange that is passed in
 * @param exchangeName 
 * @param pair 
 * @param candleTimeframe 
 * @param startTime 
 */
export const getPastCandles = (exchangeName: string, pair: string, candleTimeframe: string, startTime: Timestamp, callback) => {
    switch (exchangeName) {
        case "Binance":
            return Binance.getPastCandles(pair, candleTimeframe, startTime, callback);
    }
};

export default new Candles();
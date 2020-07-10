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

    start() {
        console.log("Starting Candles");
        Events.on('NEW_TICK', async tick => {
            const newCandle = await this.buildCandle(tick);
            console.log(newCandle);
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
                        existingCandle.high = tick.price > existingCandle.high ? tick.price : existingCandle.high;
                        existingCandle.low = tick.price < existingCandle.low ? tick.price : existingCandle.low;
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

    handleNewCandle(candle: Candle) {
        // For each subscription
        // Get the last candle
        // If the new candle openTimestamp.floor(timeframe) is equal then edit and update latest candle in db
        // Else insert a new candle and emit an event for that subscription

        // const candleCollectionName = `${tick.name}:${tick.pair}:${candleSubscription.id}:${tick.exchange}`;
        // const candlesCollection = await Database.dbReference.candlesDb.collection(candleCollectionName);
        
        // await candlesCollection.insertOne(_.cloneDeep(candle));

        // // Remove any stale candles that are longer than a day from the latest candle
        // const query = { openTimestamp: { "$lte":  candle.openTimestamp - candleSubscription.staleDuration }};
        // const expiredCandles = await candlesCollection.find(query).toArray();
        // console.log("expired", expiredCandles)
        // await candlesCollection.deleteMany(query);

        // candleSubscription.callback({
        //     expiredCandles, 
        //     candle, 
        //     candleCollectionName,
        //     exchange: tick.exchange,
        //     name: tick.name,
        //     pair: tick.pair  
        // });
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
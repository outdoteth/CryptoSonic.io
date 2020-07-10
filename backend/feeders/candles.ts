import Events = require('../events/events');
import { v4 as uuidv4 } from 'uuid';
import Database = require('../database/database');
import { Candle, Timestamp } from '../utils/types';
import * as _ from 'lodash';
import { cacheDb } from '../cache/cache';
import * as Binance from "./binance";

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
        Events.on('NEW_TICK', tick => {
            if (!this.mutexGuards[tick.name])  { // Data loss here is ok. We don't want to have a backlog and overflow the stack
                this.mutexGuards[tick.name] = true;

                cacheDb.get(`stats:simple:${tick.name}`, async (err, cacheItem) => {
                    if (err) throw new Error(err);

                    const newCacheItem = JSON.parse(cacheItem) || { exchanges: {} };
                    if (!newCacheItem.exchanges[tick.exchange]) newCacheItem.exchanges[tick.exchange] = {};
                    if (!newCacheItem.exchanges[tick.exchange][tick.pair]) newCacheItem.exchanges[tick.exchange][tick.pair] = {};

                    for (const candleSubscription of this.candleSubscriptions) {
                        const candle: Candle = newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.timeframeName]; 
                        const currentCandleOpenTimestamp = Math.floor(Date.now() / candleSubscription.timeframe) * candleSubscription.timeframe;

                        if (candle && candle.openTimestamp === currentCandleOpenTimestamp ) {
                            candle.volume += tick.volume;
                            candle.close = tick.price;	
                            if (tick.price > candle.high) candle.high = tick.price;
                            if (tick.price < candle.low) candle.low = tick.price;	
                        } else {
                            const newCandle: Candle = {
                                openTimestamp: currentCandleOpenTimestamp,
                                volume: tick.volume,
                                high: tick.price,
                                low: tick.price,
                                open: tick.price,
                                close: tick.price
                            }
                            newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.id] = newCandle;

                            if (candle && candle.openTimestamp !== currentCandleOpenTimestamp) {
                                const candleCollectionName = `${tick.name}:${tick.pair}:${candleSubscription.id}:${tick.exchange}`;
                                const candlesCollection = await Database.dbReference.candlesDb.collection(candleCollectionName);
                                
                                await candlesCollection.insertOne(_.cloneDeep(candle));

                                // Remove any stale candles that are longer than a day from the latest candle
                                const query = { openTimestamp: { "$lte":  candle.openTimestamp - candleSubscription.staleDuration }};
                                const expiredCandles = await candlesCollection.find(query).toArray();
                                console.log("expired", expiredCandles)
                                await candlesCollection.deleteMany(query);

                                candleSubscription.callback({
                                    expiredCandles, 
                                    candle, 
                                    candleCollectionName,
                                    exchange: tick.exchange,
                                    name: tick.name,
                                    pair: tick.pair  
                                });
                            }
                        }
                    }

                    cacheDb.set(`stats:simple:${tick.name}`, JSON.stringify(newCacheItem), (err, res) => {
                        if (err) throw new Error(err);
                    });

                    this.mutexGuards[tick.name] = false;
                }); 
            }
        });
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
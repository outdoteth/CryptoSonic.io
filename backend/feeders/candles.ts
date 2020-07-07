import Events = require('../events/events');
import { v4 as uuidv4 } from 'uuid';
import Database = require('../database/database');
import { Candle } from '../utils/types';
import * as _ from 'lodash';
import { cacheDb } from '../cache/cache';

interface CandleSubscription {
    name: string,
    timeframe: number,
    staleDuration: number,
    callback?: any,
    id?: string,
}

class Candles {
    private candleSubscriptions: CandleSubscription[];
    private mutexGuards: {}; // Use to make sure that we only atomically (maybe add in locking so we can wait for it?)

    constructor(candleSubscriptions) {
        this.candleSubscriptions = candleSubscriptions;
        this.mutexGuards = {};
    }

    initialise(candleSubscriptions) {
        // Run through each coin and get their candles
        for (const coin of candleSubscriptions) {
            
        }
        // Create those coins candles in the db
        // Allow subscriptions to each coins timeframe
        // Loop through each of those timeframes and then call whoever has subscribed to each of them 
    }

    start() {
        console.log("Starting Candles");
        Events.on('NEW_TICK', tick => {
            if (!this.mutexGuards[tick.name])  {
                this.mutexGuards[tick.name] = true;

                cacheDb.get(`stats:simple:${tick.name}`, async (err, cacheItem) => {
                    if (err) throw new Error(err);

                    const newCacheItem = JSON.parse(cacheItem) || { exchanges: {} };
                    if (!newCacheItem.exchanges[tick.exchange]) newCacheItem.exchanges[tick.exchange] = {};
                    if (!newCacheItem.exchanges[tick.exchange][tick.pair]) newCacheItem.exchanges[tick.exchange][tick.pair] = {};

                    for (const candleSubscription of this.candleSubscriptions) {
                        const candle: Candle = newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.name]; 
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
                            newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.name] = newCandle;

                            if (candle && candle.openTimestamp !== currentCandleOpenTimestamp) {
                                const candleCollectionName = `${tick.name}:${tick.pair}:${candleSubscription.name}:${tick.exchange}`;

                                const collections = await Database.dbReference.candlesDb.listCollections().toArray();
                                const candlesCollectionExists = collections.find(({ name }) => name === candleCollectionName);
                                if (!candlesCollectionExists) {
                                    await Database.createCandlesCollection(candleCollectionName);
                                }

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
     * @param subscription 
     */
    subscribe(subscription: CandleSubscription, callback) {
        // TODO: Add in logic so that we can do this
        const exists = this.candleSubscriptions.some(({ name }) => name === subscription.name);
        if (exists) throw new Error("Cannot create a timeframe that already exists");

        const id = uuidv4();
        this.candleSubscriptions.push({ ...subscription, id, callback });

        return () => this.candleSubscriptions.filter(x => x.id !== id);
    }
}

export const candles = new Candles();
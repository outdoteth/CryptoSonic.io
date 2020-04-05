import Events = require('../../events/events');
import Database = require('../../database/database');
import {cacheDb} from '../../cache/cache';
import {Candle} from '../../utils/types';

interface SimpleStatCache {
	lastUpdate: number,
	exchanges: any,
}


export function start() {
	console.log('Starting SimpleStats');

	Events.on('NEW_TICK', tick => {

		cacheDb.get(`stats:simple:${tick.name}`, (err, cacheItem) => {
			if (err) throw new Error(err);

			if (cacheItem === null) {
				const initCacheData: SimpleStatCache = {
					lastUpdate: Date.now(),		
					exchanges: {
						[`${tick.exchange}`]: {
							[`${tick.pair}`]: [
								{
									openTimestamp: Math.floor(Date.now() / (1000 * 60 * 5)) * 1000 * 60 * 5, // 5 minute candles 
									volume: tick.volume,
									high: tick.price,
									low: tick.price,
									open: tick.price,
									close: tick.price,	
								}
							]
						}	
					},
				};

				cacheDb.set(`stats:simple:${tick.name}`, JSON.stringify(initCacheData), (err, res) => {
					if (err) throw new Error(err);
				}); 
			} else {
				const newCacheItem = JSON.parse(cacheItem);

				// Initialise the exhange and pair key/value pairs in case they have been erased or don't already exist
				if (!newCacheItem.exchanges[`${tick.exchange}`]) newCacheItem.exchanges[`${tick.exchange}`] = {};
				if (!newCacheItem.exchanges[`${tick.exchange}`][`${tick.pair}`]) newCacheItem.exchanges[`${tick.exchange}`][`${tick.pair}`] = [];
				
				const lastPairCandle = newCacheItem.exchanges[`${tick.exchange}`][`${tick.pair}`].slice(-1)[0];
				const currentCandleOpenTimestamp = Math.floor(Date.now() / (1000 * 60 * 5)) * 1000 * 60 * 5;

				// Check that the candle fits within the current candle timeframe, otherwise create a new candle
				if (lastPairCandle && lastPairCandle.openTimestamp === currentCandleOpenTimestamp ) {
					lastPairCandle.volume += tick.volume;
					lastPairCandle.close = tick.price;	
					if (tick.price > lastPairCandle.high) lastPairCandle.high = tick.price;
				       	if (tick.price < lastPairCandle.low) lastPairCandle.low = tick.price;	
				} else {
					//TODO: keep on pushing empty candles until the timestamp matches the current timestamp
					const newPairCandle: Candle = {
						openTimestamp: currentCandleOpenTimestamp,
						volume: tick.volume,
						high: tick.price,
						low: tick.price,
						open: tick.price,
						close: tick.price
					}

					newCacheItem.exchanges[`${tick.exchange}`][`${tick.pair}`].push(newPairCandle);
				}

				// Check whether we should update the cache or the main db
				if (Date.now() - newCacheItem.lastUpdate > 1000 * 10) {
					//TODO: Merge and append the cache data with the db data
					cacheDb.set(`stats:simple:${tick.name}`, JSON.stringify({ lastUpdate: Date.now(), exchanges: {} }), (err, res) => {
						if (err) throw new Error(err);
					});
				} else {
					cacheDb.set(`stats:simple:${tick.name}`, JSON.stringify(newCacheItem), (err, res) => {
						if (err) throw new Error(err);
					});
				}
			}
		});
	});
}



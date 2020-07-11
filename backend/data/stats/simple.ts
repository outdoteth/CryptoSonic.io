import Events = require('../../events/events');
import Database = require('../../database/database');
import {cacheDb} from '../../cache/cache';
import {Candle} from '../../utils/types';
import Candles from "../../feeders/candles";
import { FIVE_MINUTES, DAY, stringToTimeframe } from '../../utils/constants';
import * as _ from 'lodash';

export function start() {
	console.log('Starting SimpleStats');

	const timeframe = "15m";
	const staleDuration = DAY;
	Events.on(`NEW_CANDLE:${timeframe}:${DAY}`, async candleInfo => {
		const {
			name,
			symbol,
			exchange,
			candleCollName,
			pair,
			expiredCandles,
			candle,
		} = candleInfo;

		const simpleStatCollName = `simple:${name}:${symbol}`;
		const simpleStatColl = await Database.dbReference.statsDb.collection(simpleStatCollName);
		const simpleStat = await simpleStatColl.findOne({ pair, exchangeName: exchange });
		
		const candleColl = await Database.dbReference.candlesDb.collection(candleCollName);

		// Deduct expired volume
		const expiredVolume = expiredCandles.reduce((volume, candle) => volume + candle.volume, 0);
		simpleStat.daily.volume -= expiredVolume;
		
		// Recalculate highs/lows if neccessary
		const expiredHigh = expiredCandles.some(({ high }) => high === simpleStat.daily.high);
		const expiredLow = expiredCandles.some(({ low }) => low === simpleStat.daily.low);
		if (expiredHigh || expiredLow) {
			const highestCandle = (await candleColl.find().sort({ high: -1 }).limit(1).toArray()).last();
			const lowestCandle = (await candleColl.find().sort({ low: 1 }).limit(1).toArray()).last();

			simpleStat.daily.high = highestCandle?.high;
			simpleStat.daily.low = lowestCandle?.low;
		}

		// Add and update the new volume, close, high, low and lastUpdate
		simpleStat.daily.volume += candle.volume;
		simpleStat.daily.open = (await candleColl.find().sort({ openTimestamp: 1 }).limit(1).toArray()).last()?.open;
		simpleStat.daily.high = Math.max(simpleStat.daily.high, candle.high);
		simpleStat.daily.low = Math.min(simpleStat.daily.low, candle.low);
		simpleStat.daily.close = candle.close;

		simpleStat.lastUpdate = Date.now();

		await simpleStatColl.updateOne({ pair, exchangeName: exchange}, { "$set": simpleStat, });
	});
}



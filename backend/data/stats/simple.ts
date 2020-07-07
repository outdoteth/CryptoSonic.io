import Events = require('../../events/events');
import Database = require('../../database/database');
import {cacheDb} from '../../cache/cache';
import {Candle} from '../../utils/types';
import { candles } from "../../feeders/candles";
import { FIVE_MINUTES, DAY } from '../../utils/constants';
import * as _ from 'lodash';

interface SimpleStatCache {
	lastUpdate: number,
	exchanges: any,
}

export function start() {
	console.log('Starting SimpleStats');

	candles.subscribe({
		name: "5min",
		timeframe: FIVE_MINUTES,
		staleDuration: FIVE_MINUTES * 2,
	}, async candleInfo => {
		const { expiredCandles, name, candle, pair, candleCollectionName } = candleInfo;

		// Update the stats; open, volume and lastUpdate
		const statsCollection = await Database.dbReference.statsDb.collection("stats:simple");
		const stats = await statsCollection.findOne({ name });
		console.log(stats)

		stats.open = _.last(_.sortBy(expiredCandles, "openTimestamp"))?.close || 0;

		const staleVolume = expiredCandles.reduce((volume, candle) => volume + candle.volume, 0);
		stats.volume += candle.volume;
		stats.volume -= staleVolume;

		stats.lastUpdate = Date.now();

		const collection = await Database.dbReference.candlesDb.collection(candleCollectionName);
		const list = await collection.find(); 
		console.log("all candles", await list.toArray());

		statsCollection.findOneAndUpdate(
			{ _id: stats._id},
			{ $set: { ...stats }},
		);
	});
}



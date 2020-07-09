import Events = require('../../events/events');
import Database = require('../../database/database');
import {cacheDb} from '../../cache/cache';
import {Candle} from '../../utils/types';
import Candles from "../../feeders/candles";
import { FIVE_MINUTES, DAY } from '../../utils/constants';
import * as _ from 'lodash';

export function start() {
	console.log('Starting SimpleStats');

	Candles.subscribe({
		timeframeName: "5min",
		timeframe: FIVE_MINUTES,
		staleDuration: FIVE_MINUTES * 2,
	}, async candleInfo => {
		const { candle, expiredCandles, name, candleCollectionName } = candleInfo;

		// Update the stats; open, volume and lastUpdate
		const statsCollection = await Database.dbReference.statsDb.collection("stats:simple");
		const stats = await statsCollection.findOne({ name });

		console.log("statsrstrstrst", stats)

		stats.open.daily = _.last(_.sortBy(expiredCandles, "openTimestamp"))?.close || 0.0;

		const staleVolume = expiredCandles.reduce((volume, candle) => volume + candle.volume, 0);
		stats.volume -= staleVolume;
		stats.volume += candle.volume;

		stats.lastUpdate = Date.now();

		console.log(stats);

		const candleCollection = await Database.dbReference.candlesDb.collection(candleCollectionName);
		const list = await candleCollection.find(); 
		console.log("candles", list);

		statsCollection.findOneAndUpdate(
			{ _id: stats._id},
			{ $set: { ...stats }},
		);
	});
}



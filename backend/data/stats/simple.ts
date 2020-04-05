import Events = require('../../events/events');
import Database = require('../../database/database');
import {cacheDb} from '../../cache/cache';

interface SimpleStatCache {
	lastUpdate: number,
	price: number,
}

export function start() {
	console.log('Starting SimpleStats');

	Events.on('NEW_TICK', tick => {
		const cacheData: SimpleStatCache = {
			lastUpdate: Date.now(),		
			price: tick.price,
		};

		cacheDb.get(`stats:simple:${tick.name}`, (err, cacheItem) => {
			if (err) throw new Error(err);

			if (cacheItem === null) {
				cacheDb.set(`stats:simple:${tick.name}`, JSON.stringify(cacheData), (err, res) => {
					if (err) throw new Error(err);
				}); 
			} else {
				cacheItem = JSON.parse(cacheItem);
				cacheData.lastUpdate = cacheItem.lastUpdate;

				cacheDb.set(`stats:simple:${tick.name}`, JSON.stringify(cacheData), (err, res) => {
					if (err) throw new Error(err);

					if (Date.now() - cacheItem.lastUpdate > 1000 * 10) {
						//Database.dbReference.statsDb.insert; 
						console.log(cacheData);	
					}
				});
			}
		});
	});
}



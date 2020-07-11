import  { MongoClient } from 'mongodb';
import * as _ from "lodash";
import Candles, { CandleSubscription, getPastCandles } from '../feeders/candles';
import { CoinConfig } from '../utils/types';
import { DAY, stringToTimeframe } from '../utils/constants';
import { Candle } from "../utils/types";

const dbUrl = 'mongodb://localhost:27017';
const STATS_DB_NAME = 'stats'
const CANDLES_DB_NAME = "candles";

const client = new MongoClient(dbUrl, { useUnifiedTopology: true });

interface DbReference {
	statsDb: any,
	candlesDb: any,
}

class Database {
	dbReference: DbReference;
	
	constructor() {
		this.dbReference = {
			statsDb: null,
			candlesDb: null,
		}	
	}

	async start(coins: CoinConfig[], candleSubscriptions: CandleSubscription[]) {
		await client.connect();
		this.dbReference.statsDb = await client.db(STATS_DB_NAME);
		this.dbReference.candlesDb = await client.db(CANDLES_DB_NAME);
		console.log('Connected to mongodb server');

		await this.initialise(coins, candleSubscriptions);	
	}

	async initialise(coins: CoinConfig[], candleSubscriptions: CandleSubscription[]) {
		this.initialiseCoinStats(coins);
		await this.initialiseCandles(coins, candleSubscriptions);
		await this.initialiseCoinSimpleStats(coins);
	}

	async initialiseCandles(coins: CoinConfig[], candleSubscriptions: CandleSubscription[]) {
		// For each candlesubscription go through each exchange and pair and write this to the db
		for (const coin of coins) {
			for (const { exchangeName, pairs } of coin.exchanges) {
				for (const pair of pairs) {
					for (const subscription of candleSubscriptions) {
						const candleCollectionName = `${coin.name}:${pair}:${subscription.timeframeName}:${subscription.staleDuration}:${exchangeName}`;
	
						// Create collection if it doesn't exist
						const collections = await this.dbReference.candlesDb.listCollections().toArray();
						const candlesCollectionExists = collections.find(({ name }) => name === candleCollectionName);
						if (!candlesCollectionExists) await this.createCandlesCollection(candleCollectionName);
	
						const candlesCollection = await this.dbReference.candlesDb.collection(candleCollectionName);
	
						// Remove any stale candles
						const query = { openTimestamp: { "$lte":  Date.now() - subscription.staleDuration }};
						await candlesCollection.deleteMany(query);
	
						// Get all of the missing candles since the last time we updated
						const lastCandle = (await candlesCollection.find().sort({ openTimestamp: -1 }).limit(1).toArray())[0];
						const startTime = Math.max(lastCandle?.openTimestamp || 0, Date.now() - subscription.staleDuration) + 1;
						await getPastCandles(exchangeName, pair, subscription.timeframeName, startTime, async (candles, status) => {
							if (candles.length) await candlesCollection.insertMany(_.cloneDeep(candles));
							if (status.done) console.log(`Got ${status.candlesCount} candles for: ${candleCollectionName}`);
						});
					}
				}
			}
		}
	}

	async createCandlesCollection(collectionName) {
		return new Promise(async resolve => {
			const candleCollection = await this.dbReference.candlesDb.createCollection(collectionName, {
				"validator": {
					"$jsonSchema": { 
							"bsonType": "object",
							"required": ["high", "low", "open", "close", "volume", "openTimestamp"],
							"properties": {
								"high": { "bsonType": ["double", "int"], "description": "high" },
								"low": { "bsonType": ["double", "int"], "description": "low" },
								"open": { "bsonType": ["double", "int"], "description": "open"},
								"close": { "bsonType": ["double", "int"], "description": "close" },
								"volume": { "bsonType": ["double", "int"], "description": "volume" },
								// Javascript casts all numbers to a double so use that for numbers
								"openTimestamp": { "bsonType": ["double", "int"], "description": "openTimestamp" }
							}
						}
					}
			});

			console.log(`Created collection ${collectionName} in candles db`);
			resolve(candleCollection);
		});
	}

	async initialiseCoinStats(coins) {
		const statsCollections = await this.dbReference.statsDb.listCollections().toArray();

		const coinStatsExists = statsCollections.find(({ name }) => name === "coinStats");
		if (!coinStatsExists) await this.createCoinStats();
		
		const coinStatsCollection: any =  await this.dbReference.statsDb.collection("coinStats");
		return Promise.all(coins.map(({ name, symbol, exchanges }) => {
			return coinStatsCollection.findOneAndUpdate(
				{ name, symbol, exchanges: exchanges.map(({ exchangeName }) => exchangeName) },
				{ "$set": { 
					name, 
					symbol, 
					lastUpdate: 0,
					exchanges: exchanges.map(({ exchangeName }) => exchangeName) 
				}, },
				{ upsert: true } // insert the document if it does not exist
			);
		}));
	}

	// Container pointing to more nuanced stats
	async createCoinStats() {
		return new Promise(async resolve => {
			const coinStatsCollection = await this.dbReference.statsDb.createCollection('coinStats', {
				'validator': {
					'$jsonSchema': {
						'bsonType': 'object',
						"description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
						'required': ['lastUpdate', 'name', 'symbol', "exchanges"],
						'properties': {
							"lastUpdate": { "bsonType": ["double", "int"] },
							"name": { "bsonType": "string" },
							"symbol": { "bsonType": "string" },
							"exchanges": { "bsonType": "array" }
						}	
					}
				} 	
			});

			console.log('Created collection coinStats in stats db');
			resolve(coinStatsCollection);
		});
	}

	async initialiseCoinSimpleStats(coins) {
		// Go through each pair and calculate the stats using the candles that we just wrote to the db
		const statsCollections = await this.dbReference.statsDb.listCollections().toArray();

		const promises = coins.map(({ name, symbol, exchanges, }) =>
			Promise.all(exchanges.map(async ({ exchangeName, pairs }) => {
				const collName = `simple:${name}:${symbol}`;
				const collExists = statsCollections.find(({ name }) => name === collName);
				if (!collExists) await this.createCoinSimpleStats(name, symbol);

				const coll: any =  await this.dbReference.statsDb.collection(collName);

				const updateSimpleStats = async pair => {
					const query = { pair, exchangeName };
					let statsForPair = await coll.findOne(query);
					if (!statsForPair) {
						statsForPair = {
							pair,
							exchangeName,
							lastUpdate: new Date().getTime(),
							daily: {
								open: 0,
								close: 0,
								high: 0,
								low: 0,
								volume: 0,
							}
						};
						await coll.insertOne(statsForPair);
					}

					const dailyCandleCollName = `${name}:${pair}:${"15m"}:${DAY}:${exchangeName}`;
					const dailyCandleColl = await this.dbReference.candlesDb.collection(dailyCandleCollName);

					const fifteenMinCandles: Candle[] = await dailyCandleColl.find().toArray();
					
					if (fifteenMinCandles.length !== 0) {
						// Calculate the simple stats
						statsForPair.daily = {
							open: fifteenMinCandles.first().open,
							close: fifteenMinCandles.last().close,
							...fifteenMinCandles.reduce<any>((totals, candle) => ({
								high: Math.max(candle.high, totals.high),
								low: Math.min(candle.low, totals.low) || candle.low,
								volume: totals.volume + candle.volume,
							}), { volume: 0, high: 0, low: 0 }),
						};
					}

					await coll.findOneAndUpdate(query, { "$set": statsForPair });
					console.log(`Initialised simple stats for ${collName}`);
				}
				
				return Promise.all(pairs.map(async pair => Promise.all([
					updateSimpleStats(pair),
				])));
			}))
		);

		return Promise.all(promises);
	}

	/**
	 * Contains an array of 24hr price and volume info for each pair on the exchange
	 */
	async createCoinSimpleStats(name, symbol) {
		const collName = `simple:${name}:${symbol}`;
		return new Promise(async resolve => {
			const coinStatsCollection = await this.dbReference.statsDb.createCollection(collName, {
				'validator': {
					'$jsonSchema': {
						'bsonType': 'object',
						"description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
						'required': ['lastUpdate', "pair", "exchangeName", "daily"],
						'properties': {
							"lastUpdate": { "bsonType": ["double", "int"] },
							"pair": { "bsonType": "string" },
							"exchangeName": { "bsonType": "string" },
							"daily": { 
								"bsonType": "object",
								"required": ["open", "close", "high", "volume", "low"],
								"properties": {
									"open": { "bsonType": ["double", "int"] },
									"close": { "bsonType": ["double", "int"] },
									"high": { "bsonType": ["double", "int"] },
									"volume": { "bsonType": ["double", "int"] },
									"low": { "bsonType": ["double", "int"] },
								} 
							},
						}
					}
				} 	
			});

			console.log(`Created coin simple stats collection ${collName} in stats db`);
			resolve(coinStatsCollection);
		});
	}

}

export = new Database();


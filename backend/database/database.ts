import  { MongoClient } from 'mongodb';
import * as _ from "lodash";
import Candles, { CandleSubscription, getPastCandles } from '../feeders/candles';
import { CoinConfig } from '../utils/types';
import { DAY, stringToTimeframe } from '../utils/constants';

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
		this.initialiseCandles(coins, candleSubscriptions);
		//this.initialiseCoinExchangeStats(coins);
	}

	async initialiseCandles(coins: CoinConfig[], candleSubscriptions: CandleSubscription[]) {
		// For each candlesubscription go through each exchange and pair and write this to the db
		coins.forEach(coin => {
			coin.exchanges.forEach(({ exchangeName, pairs }) => {
				pairs.forEach(pair => {
					candleSubscriptions.forEach(async subscription => {
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
						getPastCandles(exchangeName, pair, subscription.timeframeName, startTime).stream(async (candles, done) => {
							if (candles.length) await candlesCollection.insertMany(_.cloneDeep(candles));
							if (done) console.log("Got candles for:", candleCollectionName);
						});
					});
				})
			})
		})
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

		const statsSimpleExists = statsCollections.find(({ name }) => name === "coinStats");
		if (!statsSimpleExists) await this.createCoinStats();
		
		const statsSimpleCollection: any =  await this.dbReference.statsDb.collection("coinStats");
		return Promise.all(coins.map(({ name, symbol, exchanges }) => {
			const latestStats = { open: { daily: 0 }, volume: 0, }; // Calculate these from candles
			return statsSimpleCollection.findOneAndUpdate(
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

	// container pointing to more nuanced stats
	async createCoinStats() {
		return new Promise(async resolve => {
			const statsSimpleCollection = await this.dbReference.statsDb.createCollection('coinStats', {
				'validator': {
					'$jsonSchema': {
						'bsonType': 'object',
						"description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
						'required': ['lastUpdate', 'name', 'symbol', 'open', "volume"],
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
			resolve(statsSimpleCollection);
		});
	}

	async initialiseCoinExchangeStats(coins) {
		// Go through each pair and calculate the stats using the candles that we just wrote to the db
	}

	/**
	 * Contains an array of 24hr price and volume info for each pair on the exchange
	 */
	async createCoinExchangeStats(name, symbol, exchange) {
		return new Promise(async resolve => {
			const statsSimpleCollection = await this.dbReference.statsDb.createCollection(`${name}:${symbol}:${exchange}`, {
				'validator': {
					'$jsonSchema': {
						"bsonType": "array",
						"items": {
							'bsonType': 'object',
							"description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
							'required': ['lastUpdate', 'name', 'symbol', 'open', "volume"],
							'properties': {
								"lastUpdate": { "bsonType": ["double", "int"] },
								"pair": { "bsonType": "string" },
								"open": { 
									"bsonType": "object",
									"required": ["daily"],
									"properties": {
										"daily": { "bsonType": ["double", "int"] } 
									}
								},
								"volume": { "bsonType": ["double", "int"], "description": "Dollar aggregate volume accross all exchanges and pairs" },
							}	
						}
					}
				} 	
			});

			console.log('Created collection stats:simple in stats db');
			resolve(statsSimpleCollection);
		});
	}

}

export = new Database();


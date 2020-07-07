import  { MongoClient } from 'mongodb';
import * as _ from "lodash";

const dbUrl = 'mongodb://localhost:27017';
const STATS_DB_NAME = 'stats'
const CANDLES_DB_NAME = "candles";

const client = new MongoClient(dbUrl);

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

	async start(coins) {
		await client.connect();
		this.dbReference.statsDb = await client.db(STATS_DB_NAME);
		this.dbReference.candlesDb = await client.db(CANDLES_DB_NAME);
		console.log('Connected to mongodb server');

		await this.initialise(coins);	
	}

	async initialise(coins) {
		// Update candles collection
		// Run through each candle config and make sure that we have the candles for that

		const statsCollections = await this.dbReference.statsDb.listCollections().toArray();
	
		const statsSimpleExists = statsCollections.find(({ name }) => name === "stats:simple");
		if (!statsSimpleExists) await this.createStatsSimple();

		// Update stats simple so that each stat has the correct volume etc. using the candles collection as a base
		// for all of the calculations
		
		const statsSimpleCollection: any =  await this.dbReference.statsDb.collection("stats:simple");
		coins.forEach(coin => {
			statsSimpleCollection.findOneAndUpdate(
				{ name: coin.name, symbol: coin.symbol },
				{ "$setOnInsert": { 
					name: coin.name, 
					symbol: coin.symbol,
					open: 0, volume: 0, lastUpdate: 0
				}},
				{ upsert: true } // insert the document if it does not exist
			);
		});
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

	/**
	 * Contains 24hr price and volume info
	 */
	async createStatsSimple() {
		return new Promise(async resolve => {
			const statsSimpleCollection = await this.dbReference.statsDb.createCollection('stats:simple', {
				'validator': {
					'$jsonSchema': {
						'bsonType': 'object',
						"description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
						'required': ['lastUpdate', 'name', 'symbol', 'open', "volume"],
						'properties': {
							"lastUpdate": { "bsonType": ["double", "int"] },
							"name": { "bsonType": "string" },
							"symbol": { "bsonType": "string" },
							"open": { "bsonType": ["double", "int"] },
							"volume": { "bsonType": ["double", "int"], "description": "Dollar aggregate volume accross all exchanges and pairs" },
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


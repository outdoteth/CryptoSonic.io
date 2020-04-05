import  { MongoClient } from 'mongodb';

const dbUrl = 'mongodb://localhost:27017';
const statsDbName = 'stats';

const client = new MongoClient(dbUrl);

interface DbReference {
	statsDb: any,
}

class Database {
	dbReference: DbReference;
	
	constructor() {
		this.dbReference = {
			statsDb: null,
		}	
	}

	async start() {
		await client.connect();
		this.dbReference.statsDb = client.db(statsDbName);
		console.log('Connected to mongodb server');

		await this.initialise();	
	}

	async initialise() {
		await this.createStatsSimple();
	}

	async createStatsSimple() {
		await this.dbReference.statsDb.createCollection('stats:simple', {
			'validator': {
				'$jsonSchema': {
					'bsonType': 'object',
					'required': ['name', 'lastUpdated', 'symbol', 'exchanges'],
					'properties': {
						'name': {
							'bsonType': 'string',
							'description': 'Asset must have a stringified name',
						},
						'lastUpdated': {
							'bsonType': 'int',
							'description': 'Must contain a unix timestamp defining the last updated date'
						},
						'symbol': {
							'bsonType': 'string',
							'description': 'Asset must contain a symbol e.g. "ETH"',
						},
						'exchanges': {
							'bsonType': 'object',
							'description': 'Must contain information regarding its price data for each exchange',
							'additionalProperties': {
								'bsonType': 'object',
								'properties': {
									'price': {
										'bsonType': 'number',
									},
									'volume': {
										'bsonType': 'number',
									}
								}
							}
						}
					}	
				}
			} 	
		});

		console.log('Created stats:simple');
	}
}

export = new Database();


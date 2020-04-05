import Feeder = require("./feeders/feeder");
import Data = require("./data/data");
import Cache = require("./cache/cache");
import Database = require('./database/database');

async function main() {
	console.log('Initialising project...\n');

	await Database.start();
	Feeder.start();
	Data.start();
	Cache.start();
}

main();

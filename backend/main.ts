import Feeder = require("./feeders/feeder");
import Data = require("./data/data");
import Cache = require("./cache/cache");
import Database = require('./database/database');
import { coins as COINS_LIST } from "./coins.json";

async function main() {
	console.log('Initialising project...\n');
	await Database.start(COINS_LIST);
	Feeder.start();
	Data.start();
	Cache.start();
}

main();

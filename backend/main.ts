import Feeder = require("./feeders/feeder");
import Data = require("./data/data");
import Cache = require("./cache/cache");
import Database = require('./database/database');
import { coins as COINS_LIST } from "./coins.json";
import { candleSubscriptions } from "./candleSubscriptions.json";
import { stringToTimeframe } from "./utils/constants";

const CANDLE_SUBSCRIPTIONS = candleSubscriptions.map(subscription => ({
	...subscription,
	staleDuration: stringToTimeframe[subscription.staleDuration],
	timeframe: stringToTimeframe[subscription.timeframeName],
}));

async function main() {
	console.log('Initialising project...\n');

	await Database.start(COINS_LIST, CANDLE_SUBSCRIPTIONS);
	//Feeder.start(COINS_LIST);
	//Data.start();
	//Cache.start();
}

main();

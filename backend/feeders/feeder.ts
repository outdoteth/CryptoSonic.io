import BinanceFeeder = require("./binance");
import Candles, { CandleSubscription } from "./candles";
import { CoinConfig } from "../utils/types";

class Feeder {
	start(coins: CoinConfig[], candleSubscriptions: CandleSubscription[]) {
		console.log('Starting Feeders...');
		
		BinanceFeeder.start(coins);
		Candles.start(candleSubscriptions);
	}
}	

export = new Feeder();


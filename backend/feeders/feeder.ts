import BinanceFeeder = require("./binance");
import Candles from "./candles";

class Feeder {
	start(coins) {
		console.log('Starting Feeders...');
		
		BinanceFeeder.start(coins); // This should be started with a single config containing all info
		Candles.start();
	}
}	

export = new Feeder();


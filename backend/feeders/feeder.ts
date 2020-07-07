import BinanceFeeder = require("./binance");
import { candles } from "./candles";

// This should be fetched from a centralised config file and placed directly into the BinanceFeeder
const pairToNameMap = {
	"ETHBTC": "Ethereum"
};

class Feeder {
	start() {
		console.log('Starting Feeders...');
		
		BinanceFeeder.start(["ETHBTC"], pairToNameMap); // This should be started with a single config containing all info
		candles.start();
	}
}	

export = new Feeder();


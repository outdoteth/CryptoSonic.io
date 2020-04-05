import BinanceFeeder = require("./binance");

class Feeder {
	start() {
		console.log('Starting Feeders...');
		
		BinanceFeeder.start(["ETHBTC"], {"ETHBTC": "Ethereum"});
	}
}	

export = new Feeder;


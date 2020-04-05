import Binance = require('node-binance-api');
import typeUtils = require('../utils/types');
import Events = require('../events/events');

const binance = new Binance();

export function start(coins: [string], pairToNameMap) {
	console.log("Starting Binance Feeder");

	binance.websockets.trades(coins, trades => {
		const {E:eventTime, s:symbol, p:price, q:quantity, m:maker} = trades;

		const parsedTick: typeUtils.Tick = {
			price: parseFloat(price),
			volume: parseFloat(quantity),
			exchange: "Binance",
			isBuy: maker,	
			timestamp: eventTime,
			pair: symbol,
			name: pairToNameMap[symbol], 
		};

		Events.emit('NEW_TICK', parsedTick);
	});
}

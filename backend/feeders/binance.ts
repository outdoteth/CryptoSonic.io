import Binance = require('node-binance-api');
import * as typeUtils from '../utils/types';
import Events = require('../events/events');

const binance = new Binance();

export function start(coins: [string], pairToNameMap) {
	console.log("Starting Binance Feeder");

	// Listen to all possible trades for each coin
	binance.websockets.trades(coins, trades => {
		const {E:eventTime, s:symbol, p:price, q:quantity, m:maker} = trades;

		const parsedTick: typeUtils.Tick = {
			price: parseFloat(price),
			volume: parseFloat(quantity),
			exchange: "Binance",
			isBuy: maker,	
			timestamp: eventTime,
			pair: symbol,
			name: pairToNameMap[symbol], // We only get the symbol from binance so need to map to a name
		};

		Events.emit('NEW_TICK', parsedTick);
	});
}

export function getCandlesRange(coin, candleTimeframe: number, dateRange: typeUtils.Timestamp) {
	// Get ticks for that coin and aggregate into a candle of the given timeframe

	// Create stream

	// Pull ticks aggregate into candle, push into stream
	
	// Return stream
}

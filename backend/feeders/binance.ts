import Binance, { CandleChartInterval } from "binance-api-node";
import * as typeUtils from '../utils/types';
import Events = require('../events/events');
import * as _ from "lodash";
import { stringToTimeframe } from "../utils/constants";
import { sleep } from "../utils/helpers";

const binance =  Binance();

export function start(coins: typeUtils.CoinConfig[]) {
	console.log("Starting Binance Feeder");

	// Go through all coins and extract their Binance pairs
	const binancePairs = coins.map(({ exchanges, name, symbol }) => {
		const pairs = exchanges.find(({ exchangeName }) => exchangeName === "Binance")?.pairs; 
		return pairs && { pairs, name, symbol };
	}).filter(item => item);

	// For each pair map it to the coins name
	const pairToCoinMap = binancePairs.reduce(($map, { name, symbol, pairs }) => {
		pairs.forEach(pair => $map[pair] = { name, symbol });
		return $map;
	}, {});

	// Listen to all possible trades for each coin
	const rawPairs = binancePairs.reduce(($arr, coin) => $arr.concat(coin.pairs), []);
	binance.ws.trades(rawPairs, ({ price, quantity, maker, eventTime, symbol, }) => {
		const parsedTick: typeUtils.Tick = {
			price: parseFloat(price),
			volume: parseFloat(quantity),
			exchange: "Binance",
			isBuy: maker,	
			timestamp: eventTime,
			pair: symbol,
			name: pairToCoinMap[symbol].name,
			symbol: pairToCoinMap[symbol].symbol
		};

		Events.emit('NEW_TICK', parsedTick);
	});
}

/**
 * Get the past candles for a given coin from the startTime
 * @param coin 
 * @param candleTimeframe 
 * @param startTime 
 * 
 * @returns {*} - A stream takes a callback which we pass the candles into
 */
export async function getPastCandles(pair: string, candleTimeframe: string, startTime: typeUtils.Timestamp, callback, endTime?: typeUtils.Timestamp) {
	let gotAllCandles = false;
	let candlesCount = 0;
	while (!gotAllCandles) {
		const rawCandles = await binance.candles({ symbol: pair, interval: candleTimeframe as CandleChartInterval, limit: 500, startTime });
		
		const formattedCandles = rawCandles.map(({ openTime: openTimestamp, open, high, low, close, volume }) => {
			const Candle: typeUtils.Candle = {
				openTimestamp,
				open: +open,
				high: +high,
				low: +low,
				close: +close,
				volume: +volume,
			};
			
			return Candle;
		});

		candlesCount += formattedCandles.length;
		gotAllCandles = rawCandles.length === 0 || startTime >= endTime;
		startTime = _.last(rawCandles)?.openTime + stringToTimeframe[candleTimeframe];

		if (!gotAllCandles && rawCandles.length === 0) 
			throw new Error("Got zero candles even though we have not got all candles yet")

		callback(_.cloneDeep(formattedCandles), { done: gotAllCandles, candlesCount });
		await sleep(4000);
	}
}

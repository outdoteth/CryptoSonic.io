import { CandleSubscription } from "../feeders/candles";

export interface Tick {
	price: number,
	volume: number,
	exchange: string,
	isBuy: boolean,
	timestamp: number,
	pair: string,
	name: string,
	symbol: string,
}

export interface Candle {
	openTimestamp: number,
	volume: number,
	high: number,
	low: number,
	open: number,
	close: number,
}

export type Timestamp = number;

export interface DateRange {
	from: Timestamp,
	to: Timestamp,
}

export interface CoinConfig {
	name: string,
	symbol: string,
	exchanges: { exchangeName: string, pairs: string[] }[],
}

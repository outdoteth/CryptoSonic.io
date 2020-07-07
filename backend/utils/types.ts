export interface Tick {
	price: number,
	volume: number,
	exchange: string,
	isBuy: boolean,
	timestamp: number,
	pair: string,
	name: string,
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


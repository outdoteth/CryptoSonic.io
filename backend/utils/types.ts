export interface Tick {
	price: number,
	volume: number,
	exchange: string,
	isBuy: boolean,
	timestamp: number,
	pair: string,
	name: string,
}

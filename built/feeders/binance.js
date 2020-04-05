"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Binance = require("node-binance-api");
var Events = require("../events/events");
var binance = new Binance();
function start(coins, pairToNameMap) {
    console.log("Starting Binance Feeder");
    binance.websockets.trades(coins, function (trades) {
        var eventTime = trades.E, symbol = trades.s, price = trades.p, quantity = trades.q, maker = trades.m;
        var parsedTick = {
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
exports.start = start;

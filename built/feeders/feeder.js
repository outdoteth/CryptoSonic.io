"use strict";
var BinanceFeeder = require("./binance");
var candles_1 = require("./candles");
var Feeder = /** @class */ (function () {
    function Feeder() {
    }
    Feeder.prototype.start = function (coins) {
        console.log('Starting Feeders...');
        BinanceFeeder.start(coins); // This should be started with a single config containing all info
        candles_1.default.start();
    };
    return Feeder;
}());
module.exports = new Feeder();

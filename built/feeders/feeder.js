"use strict";
var BinanceFeeder = require("./binance");
var candles_1 = require("./candles");
// This should be fetched from a centralised config file and placed directly into the BinanceFeeder
var pairToNameMap = {
    "ETHBTC": "Ethereum"
};
var Feeder = /** @class */ (function () {
    function Feeder() {
    }
    Feeder.prototype.start = function () {
        console.log('Starting Feeders...');
        BinanceFeeder.start(["ETHBTC"], pairToNameMap); // This should be started with a single config containing all info
        candles_1.candles.start();
    };
    return Feeder;
}());
module.exports = new Feeder();

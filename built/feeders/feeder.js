"use strict";
var BinanceFeeder = require("./binance");
var Feeder = /** @class */ (function () {
    function Feeder() {
    }
    Feeder.prototype.start = function () {
        console.log('Starting Feeders...');
        BinanceFeeder.start(["ETHBTC"], { "ETHBTC": "Ethereum" });
    };
    return Feeder;
}());
module.exports = new Feeder;

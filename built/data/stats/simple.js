"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Events = require("../../events/events");
var cache_1 = require("../../cache/cache");
function start() {
    console.log('Starting SimpleStats');
    Events.on('NEW_TICK', function (tick) {
        cache_1.cacheDb.get("stats:simple:" + tick.name, function (err, cacheItem) {
            var _a, _b;
            if (err)
                throw new Error(err);
            if (cacheItem === null) {
                var initCacheData = {
                    lastUpdate: Date.now(),
                    exchanges: (_a = {},
                        _a["" + tick.exchange] = (_b = {},
                            _b["" + tick.pair] = [
                                {
                                    openTimestamp: Math.floor(Date.now() / (1000 * 60 * 5)) * 1000 * 60 * 5,
                                    volume: tick.volume,
                                    high: tick.price,
                                    low: tick.price,
                                    open: tick.price,
                                    close: tick.price,
                                }
                            ],
                            _b),
                        _a),
                };
                cache_1.cacheDb.set("stats:simple:" + tick.name, JSON.stringify(initCacheData), function (err, res) {
                    if (err)
                        throw new Error(err);
                });
            }
            else {
                var newCacheItem = JSON.parse(cacheItem);
                // Initialise the exhange and pair key/value pairs in case they have been erased or don't already exist
                if (!newCacheItem.exchanges["" + tick.exchange])
                    newCacheItem.exchanges["" + tick.exchange] = {};
                if (!newCacheItem.exchanges["" + tick.exchange]["" + tick.pair])
                    newCacheItem.exchanges["" + tick.exchange]["" + tick.pair] = [];
                var lastPairCandle = newCacheItem.exchanges["" + tick.exchange]["" + tick.pair].slice(-1)[0];
                var currentCandleOpenTimestamp = Math.floor(Date.now() / (1000 * 60 * 5)) * 1000 * 60 * 5;
                // Check that the candle fits within the current candle timeframe, otherwise create a new candle
                if (lastPairCandle && lastPairCandle.openTimestamp === currentCandleOpenTimestamp) {
                    lastPairCandle.volume += tick.volume;
                    lastPairCandle.close = tick.price;
                    if (tick.price > lastPairCandle.high)
                        lastPairCandle.high = tick.price;
                    if (tick.price < lastPairCandle.low)
                        lastPairCandle.low = tick.price;
                }
                else {
                    //TODO: keep on pushing empty candles until the timestamp matches the current timestamp
                    var newPairCandle = {
                        openTimestamp: currentCandleOpenTimestamp,
                        volume: tick.volume,
                        high: tick.price,
                        low: tick.price,
                        open: tick.price,
                        close: tick.price
                    };
                    newCacheItem.exchanges["" + tick.exchange]["" + tick.pair].push(newPairCandle);
                }
                // Check whether we should update the cache or the main db
                if (Date.now() - newCacheItem.lastUpdate > 1000 * 10) {
                    //TODO: Merge and append the cache data with the db data
                    cache_1.cacheDb.set("stats:simple:" + tick.name, JSON.stringify({ lastUpdate: Date.now(), exchanges: {} }), function (err, res) {
                        if (err)
                            throw new Error(err);
                    });
                }
                else {
                    cache_1.cacheDb.set("stats:simple:" + tick.name, JSON.stringify(newCacheItem), function (err, res) {
                        if (err)
                            throw new Error(err);
                    });
                }
            }
        });
    });
}
exports.start = start;

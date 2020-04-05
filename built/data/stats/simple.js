"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Events = require("../../events/events");
var cache_1 = require("../../cache/cache");
function start() {
    console.log('Starting SimpleStats');
    Events.on('NEW_TICK', function (tick) {
        var cacheData = {
            lastUpdate: Date.now(),
            price: tick.price,
        };
        cache_1.cacheDb.get("stats:simple:" + tick.name, function (err, cacheItem) {
            if (err)
                throw new Error(err);
            if (cacheItem === null) {
                cache_1.cacheDb.set("stats:simple:" + tick.name, JSON.stringify(cacheData), function (err, res) {
                    if (err)
                        throw new Error(err);
                });
            }
            else {
                cacheItem = JSON.parse(cacheItem);
                cacheData.lastUpdate = cacheItem.lastUpdate;
                cache_1.cacheDb.set("stats:simple:" + tick.name, JSON.stringify(cacheData), function (err, res) {
                    if (err)
                        throw new Error(err);
                    if (Date.now() - cacheItem.lastUpdate > 1000 * 10) {
                        //Database.dbReference.statsDb.insert; 
                        console.log(cacheData);
                    }
                });
            }
        });
    });
}
exports.start = start;

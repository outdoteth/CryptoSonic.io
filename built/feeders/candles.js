"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastCandles = void 0;
var Events = require("../events/events");
var uuid_1 = require("uuid");
var _ = require("lodash");
var cache_1 = require("../cache/cache");
var Binance = require("./binance");
var constants_1 = require("../utils/constants");
var Candles = /** @class */ (function () {
    function Candles() {
        this.mutexGuards = {};
        this.candleSubscriptions = [];
    }
    Candles.prototype.start = function () {
        var _this = this;
        console.log("Starting Candles");
        Events.on('NEW_TICK', function (tick) { return __awaiter(_this, void 0, void 0, function () {
            var newCandle;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.buildCandle(tick)];
                    case 1:
                        newCandle = _a.sent();
                        console.log(newCandle);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // Build a 5 min candle using redis as a cache to maintain the state
    Candles.prototype.buildCandle = function (tick) {
        var _this = this;
        return new Promise(function (resolve) {
            var cacheName = "buildCandle:" + tick.name + ":" + tick.exchange + ":" + tick.pair;
            if (!_this.mutexGuards[cacheName]) { // Data loss here is ok. We don't want to have a backlog and overflow the stack
                _this.mutexGuards[cacheName] = true;
                cache_1.cacheDb.get(cacheName, function (err, cacheItem) { return __awaiter(_this, void 0, void 0, function () {
                    var isNewCandle, existingCandle, currentCandleOpenTimestamp, newCandle;
                    return __generator(this, function (_a) {
                        if (err)
                            throw new Error(err);
                        isNewCandle = false;
                        existingCandle = _.cloneDeep(JSON.parse(cacheItem));
                        currentCandleOpenTimestamp = Math.floor(Date.now() / constants_1.FIVE_MINUTES) * constants_1.FIVE_MINUTES;
                        if ((existingCandle === null || existingCandle === void 0 ? void 0 : existingCandle.openTimestamp) === currentCandleOpenTimestamp) {
                            existingCandle.volume += tick.volume;
                            existingCandle.high = tick.price > existingCandle.high ? tick.price : existingCandle.high;
                            existingCandle.low = tick.price < existingCandle.low ? tick.price : existingCandle.low;
                            existingCandle.close = tick.price;
                            cache_1.cacheDb.set(cacheName, JSON.stringify(existingCandle), function (err, res) {
                                if (err)
                                    throw new Error(err);
                            });
                        }
                        else {
                            newCandle = {
                                high: tick.price,
                                low: tick.price,
                                open: tick.price,
                                close: tick.price,
                                openTimestamp: currentCandleOpenTimestamp,
                                volume: tick.volume,
                            };
                            isNewCandle = true;
                            cache_1.cacheDb.set(cacheName, JSON.stringify(newCandle), function (err, res) {
                                if (err)
                                    throw new Error(err);
                            });
                        }
                        this.mutexGuards[cacheName] = false;
                        return [2 /*return*/, resolve({ candle: existingCandle, isNewCandle: isNewCandle })]; // resolve() previously generated candle now that it has passed the timerange
                    });
                }); });
            }
        });
    };
    Candles.prototype.handleNewCandle = function (candle) {
        // For each subscription
        // Get the last candle
        // If the new candle openTimestamp.floor(timeframe) is equal then edit and update latest candle in db
        // Else insert a new candle and emit an event for that subscription
        // const candleCollectionName = `${tick.name}:${tick.pair}:${candleSubscription.id}:${tick.exchange}`;
        // const candlesCollection = await Database.dbReference.candlesDb.collection(candleCollectionName);
        // await candlesCollection.insertOne(_.cloneDeep(candle));
        // // Remove any stale candles that are longer than a day from the latest candle
        // const query = { openTimestamp: { "$lte":  candle.openTimestamp - candleSubscription.staleDuration }};
        // const expiredCandles = await candlesCollection.find(query).toArray();
        // console.log("expired", expiredCandles)
        // await candlesCollection.deleteMany(query);
        // candleSubscription.callback({
        //     expiredCandles, 
        //     candle, 
        //     candleCollectionName,
        //     exchange: tick.exchange,
        //     name: tick.name,
        //     pair: tick.pair  
        // });
    };
    /**
     * Subscribe to a given candle timeframe (will write candles to the given db and call the callback on new candle)
     * @param {CandleSubscription} subscription
     */
    Candles.prototype.subscribe = function (subscription, callback) {
        var _this = this;
        var id = uuid_1.v4();
        this.candleSubscriptions.push(__assign(__assign({}, subscription), { id: id, callback: callback }));
        return function () { return _this.candleSubscriptions = _this.candleSubscriptions.filter(function (x) { return x.id !== id; }); };
    };
    return Candles;
}());
/**
 * Get the correct candle stream for a pair depending on the exchange that is passed in
 * @param exchangeName
 * @param pair
 * @param candleTimeframe
 * @param startTime
 */
exports.getPastCandles = function (exchangeName, pair, candleTimeframe, startTime, callback) {
    switch (exchangeName) {
        case "Binance":
            return Binance.getPastCandles(pair, candleTimeframe, startTime, callback);
    }
};
exports.default = new Candles();

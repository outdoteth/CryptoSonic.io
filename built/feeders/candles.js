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
var Database = require("../database/database");
var _ = require("lodash");
var cache_1 = require("../cache/cache");
var Binance = require("./binance");
var Candles = /** @class */ (function () {
    function Candles() {
        this.mutexGuards = {};
        this.candleSubscriptions = [];
    }
    Candles.prototype.start = function () {
        var _this = this;
        console.log("Starting Candles");
        Events.on('NEW_TICK', function (tick) {
            if (!_this.mutexGuards[tick.name]) { // Data loss here is ok. We don't want to have a backlog and overflow the stack
                _this.mutexGuards[tick.name] = true;
                cache_1.cacheDb.get("stats:simple:" + tick.name, function (err, cacheItem) { return __awaiter(_this, void 0, void 0, function () {
                    var newCacheItem, _i, _a, candleSubscription, candle, currentCandleOpenTimestamp, newCandle, candleCollectionName, candlesCollection, query, expiredCandles;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (err)
                                    throw new Error(err);
                                newCacheItem = JSON.parse(cacheItem) || { exchanges: {} };
                                if (!newCacheItem.exchanges[tick.exchange])
                                    newCacheItem.exchanges[tick.exchange] = {};
                                if (!newCacheItem.exchanges[tick.exchange][tick.pair])
                                    newCacheItem.exchanges[tick.exchange][tick.pair] = {};
                                _i = 0, _a = this.candleSubscriptions;
                                _b.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 8];
                                candleSubscription = _a[_i];
                                candle = newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.timeframeName];
                                currentCandleOpenTimestamp = Math.floor(Date.now() / candleSubscription.timeframe) * candleSubscription.timeframe;
                                if (!(candle && candle.openTimestamp === currentCandleOpenTimestamp)) return [3 /*break*/, 2];
                                candle.volume += tick.volume;
                                candle.close = tick.price;
                                if (tick.price > candle.high)
                                    candle.high = tick.price;
                                if (tick.price < candle.low)
                                    candle.low = tick.price;
                                return [3 /*break*/, 7];
                            case 2:
                                newCandle = {
                                    openTimestamp: currentCandleOpenTimestamp,
                                    volume: tick.volume,
                                    high: tick.price,
                                    low: tick.price,
                                    open: tick.price,
                                    close: tick.price
                                };
                                newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.id] = newCandle;
                                if (!(candle && candle.openTimestamp !== currentCandleOpenTimestamp)) return [3 /*break*/, 7];
                                candleCollectionName = tick.name + ":" + tick.pair + ":" + candleSubscription.id + ":" + tick.exchange;
                                return [4 /*yield*/, Database.dbReference.candlesDb.collection(candleCollectionName)];
                            case 3:
                                candlesCollection = _b.sent();
                                return [4 /*yield*/, candlesCollection.insertOne(_.cloneDeep(candle))];
                            case 4:
                                _b.sent();
                                query = { openTimestamp: { "$lte": candle.openTimestamp - candleSubscription.staleDuration } };
                                return [4 /*yield*/, candlesCollection.find(query).toArray()];
                            case 5:
                                expiredCandles = _b.sent();
                                console.log("expired", expiredCandles);
                                return [4 /*yield*/, candlesCollection.deleteMany(query)];
                            case 6:
                                _b.sent();
                                candleSubscription.callback({
                                    expiredCandles: expiredCandles,
                                    candle: candle,
                                    candleCollectionName: candleCollectionName,
                                    exchange: tick.exchange,
                                    name: tick.name,
                                    pair: tick.pair
                                });
                                _b.label = 7;
                            case 7:
                                _i++;
                                return [3 /*break*/, 1];
                            case 8:
                                cache_1.cacheDb.set("stats:simple:" + tick.name, JSON.stringify(newCacheItem), function (err, res) {
                                    if (err)
                                        throw new Error(err);
                                });
                                this.mutexGuards[tick.name] = false;
                                return [2 /*return*/];
                        }
                    });
                }); });
            }
        });
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
exports.getPastCandles = function (exchangeName, pair, candleTimeframe, startTime) {
    switch (exchangeName) {
        case "Binance":
            return Binance.getPastCandles(pair, candleTimeframe, startTime);
    }
};
exports.default = new Candles();

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
var Events = require("../events/events");
var uuid_1 = require("uuid");
var Database = require("../database/database");
var _ = require("lodash");
var cache_1 = require("../cache/cache");
var Candles = /** @class */ (function () {
    function Candles(candleSubscriptions) {
        this.candleSubscriptions = candleSubscriptions;
        this.mutexGuards = {};
    }
    Candles.prototype.initialise = function (candleSubscriptions) {
        // Run through each coin and get their candles
        // Create those coins candles in the db
        // Allow subscriptions to each coins timeframe
        // Loop through each of those timeframes and then run the 
    };
    Candles.prototype.start = function () {
        var _this = this;
        console.log("Starting Candles");
        Events.on('NEW_TICK', function (tick) {
            if (!_this.mutexGuards[tick.name]) {
                _this.mutexGuards[tick.name] = true;
                cache_1.cacheDb.get("stats:simple:" + tick.name, function (err, cacheItem) { return __awaiter(_this, void 0, void 0, function () {
                    var newCacheItem, _loop_1, _i, _a, candleSubscription;
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
                                _loop_1 = function (candleSubscription) {
                                    var candle, currentCandleOpenTimestamp, newCandle, candleCollectionName_1, collections, candlesCollectionExists, candlesCollection, query, expiredCandles;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                candle = newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.name];
                                                currentCandleOpenTimestamp = Math.floor(Date.now() / candleSubscription.timeframe) * candleSubscription.timeframe;
                                                if (!(candle && candle.openTimestamp === currentCandleOpenTimestamp)) return [3 /*break*/, 1];
                                                candle.volume += tick.volume;
                                                candle.close = tick.price;
                                                if (tick.price > candle.high)
                                                    candle.high = tick.price;
                                                if (tick.price < candle.low)
                                                    candle.low = tick.price;
                                                return [3 /*break*/, 9];
                                            case 1:
                                                newCandle = {
                                                    openTimestamp: currentCandleOpenTimestamp,
                                                    volume: tick.volume,
                                                    high: tick.price,
                                                    low: tick.price,
                                                    open: tick.price,
                                                    close: tick.price
                                                };
                                                newCacheItem.exchanges[tick.exchange][tick.pair][candleSubscription.name] = newCandle;
                                                if (!(candle && candle.openTimestamp !== currentCandleOpenTimestamp)) return [3 /*break*/, 9];
                                                candleCollectionName_1 = tick.name + ":" + tick.pair + ":" + candleSubscription.name + ":" + tick.exchange;
                                                return [4 /*yield*/, Database.dbReference.candlesDb.listCollections().toArray()];
                                            case 2:
                                                collections = _a.sent();
                                                candlesCollectionExists = collections.find(function (_a) {
                                                    var name = _a.name;
                                                    return name === candleCollectionName_1;
                                                });
                                                if (!!candlesCollectionExists) return [3 /*break*/, 4];
                                                return [4 /*yield*/, Database.createCandlesCollection(candleCollectionName_1)];
                                            case 3:
                                                _a.sent();
                                                _a.label = 4;
                                            case 4: return [4 /*yield*/, Database.dbReference.candlesDb.collection(candleCollectionName_1)];
                                            case 5:
                                                candlesCollection = _a.sent();
                                                return [4 /*yield*/, candlesCollection.insertOne(_.cloneDeep(candle))];
                                            case 6:
                                                _a.sent();
                                                query = { openTimestamp: { "$lte": candle.openTimestamp - candleSubscription.staleDuration } };
                                                return [4 /*yield*/, candlesCollection.find(query).toArray()];
                                            case 7:
                                                expiredCandles = _a.sent();
                                                console.log("expired", expiredCandles);
                                                return [4 /*yield*/, candlesCollection.deleteMany(query)];
                                            case 8:
                                                _a.sent();
                                                candleSubscription.callback({
                                                    expiredCandles: expiredCandles,
                                                    candle: candle,
                                                    candleCollectionName: candleCollectionName_1,
                                                    exchange: tick.exchange,
                                                    name: tick.name,
                                                    pair: tick.pair
                                                });
                                                _a.label = 9;
                                            case 9: return [2 /*return*/];
                                        }
                                    });
                                };
                                _i = 0, _a = this.candleSubscriptions;
                                _b.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                candleSubscription = _a[_i];
                                return [5 /*yield**/, _loop_1(candleSubscription)];
                            case 2:
                                _b.sent();
                                _b.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4:
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
     * @param subscription
     */
    Candles.prototype.subscribe = function (subscription, callback) {
        var _this = this;
        // TODO: Add in logic so that we can do this
        var exists = this.candleSubscriptions.some(function (_a) {
            var name = _a.name;
            return name === subscription.name;
        });
        if (exists)
            throw new Error("Cannot create a timeframe that already exists");
        var id = uuid_1.v4();
        this.candleSubscriptions.push(__assign(__assign({}, subscription), { id: id, callback: callback }));
        return function () { return _this.candleSubscriptions.filter(function (x) { return x.id !== id; }); };
    };
    return Candles;
}());
exports.candles = new Candles();

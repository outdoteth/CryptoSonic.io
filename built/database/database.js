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
var mongodb_1 = require("mongodb");
var _ = require("lodash");
var candles_1 = require("../feeders/candles");
var constants_1 = require("../utils/constants");
var dbUrl = 'mongodb://localhost:27017';
var STATS_DB_NAME = 'stats';
var CANDLES_DB_NAME = "candles";
var client = new mongodb_1.MongoClient(dbUrl, { useUnifiedTopology: true });
var Database = /** @class */ (function () {
    function Database() {
        this.dbReference = {
            statsDb: null,
            candlesDb: null,
        };
    }
    Database.prototype.start = function (coins, candleSubscriptions) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, client.connect()];
                    case 1:
                        _c.sent();
                        _a = this.dbReference;
                        return [4 /*yield*/, client.db(STATS_DB_NAME)];
                    case 2:
                        _a.statsDb = _c.sent();
                        _b = this.dbReference;
                        return [4 /*yield*/, client.db(CANDLES_DB_NAME)];
                    case 3:
                        _b.candlesDb = _c.sent();
                        console.log('Connected to mongodb server');
                        return [4 /*yield*/, this.initialise(coins, candleSubscriptions)];
                    case 4:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Database.prototype.initialise = function (coins, candleSubscriptions) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.initialiseCoinStats(coins);
                        return [4 /*yield*/, this.initialiseCandles(coins, candleSubscriptions)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.initialiseCoinExchangeStats(coins)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Database.prototype.initialiseCandles = function (coins, candleSubscriptions) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, coins_1, coin, _a, _b, _c, exchangeName, pairs, _d, pairs_1, pair, _loop_1, this_1, _e, candleSubscriptions_1, subscription;
            var _this = this;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _i = 0, coins_1 = coins;
                        _f.label = 1;
                    case 1:
                        if (!(_i < coins_1.length)) return [3 /*break*/, 10];
                        coin = coins_1[_i];
                        _a = 0, _b = coin.exchanges;
                        _f.label = 2;
                    case 2:
                        if (!(_a < _b.length)) return [3 /*break*/, 9];
                        _c = _b[_a], exchangeName = _c.exchangeName, pairs = _c.pairs;
                        _d = 0, pairs_1 = pairs;
                        _f.label = 3;
                    case 3:
                        if (!(_d < pairs_1.length)) return [3 /*break*/, 8];
                        pair = pairs_1[_d];
                        _loop_1 = function (subscription) {
                            var candleCollectionName, collections, candlesCollectionExists, candlesCollection, query, lastCandle, startTime;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        candleCollectionName = coin.name + ":" + pair + ":" + subscription.timeframeName + ":" + subscription.staleDuration + ":" + exchangeName;
                                        return [4 /*yield*/, this_1.dbReference.candlesDb.listCollections().toArray()];
                                    case 1:
                                        collections = _a.sent();
                                        candlesCollectionExists = collections.find(function (_a) {
                                            var name = _a.name;
                                            return name === candleCollectionName;
                                        });
                                        if (!!candlesCollectionExists) return [3 /*break*/, 3];
                                        return [4 /*yield*/, this_1.createCandlesCollection(candleCollectionName)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3: return [4 /*yield*/, this_1.dbReference.candlesDb.collection(candleCollectionName)];
                                    case 4:
                                        candlesCollection = _a.sent();
                                        query = { openTimestamp: { "$lte": Date.now() - subscription.staleDuration } };
                                        return [4 /*yield*/, candlesCollection.deleteMany(query)];
                                    case 5:
                                        _a.sent();
                                        return [4 /*yield*/, candlesCollection.find().sort({ openTimestamp: -1 }).limit(1).toArray()];
                                    case 6:
                                        lastCandle = (_a.sent())[0];
                                        startTime = Math.max((lastCandle === null || lastCandle === void 0 ? void 0 : lastCandle.openTimestamp) || 0, Date.now() - subscription.staleDuration) + 1;
                                        return [4 /*yield*/, candles_1.getPastCandles(exchangeName, pair, subscription.timeframeName, startTime, function (candles, status) { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!candles.length) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, candlesCollection.insertMany(_.cloneDeep(candles))];
                                                        case 1:
                                                            _a.sent();
                                                            _a.label = 2;
                                                        case 2:
                                                            if (status.done)
                                                                console.log("Got " + status.candlesCount + " candles for: " + candleCollectionName);
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 7:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _e = 0, candleSubscriptions_1 = candleSubscriptions;
                        _f.label = 4;
                    case 4:
                        if (!(_e < candleSubscriptions_1.length)) return [3 /*break*/, 7];
                        subscription = candleSubscriptions_1[_e];
                        return [5 /*yield**/, _loop_1(subscription)];
                    case 5:
                        _f.sent();
                        _f.label = 6;
                    case 6:
                        _e++;
                        return [3 /*break*/, 4];
                    case 7:
                        _d++;
                        return [3 /*break*/, 3];
                    case 8:
                        _a++;
                        return [3 /*break*/, 2];
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    Database.prototype.createCandlesCollection = function (collectionName) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        var candleCollection;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.dbReference.candlesDb.createCollection(collectionName, {
                                        "validator": {
                                            "$jsonSchema": {
                                                "bsonType": "object",
                                                "required": ["high", "low", "open", "close", "volume", "openTimestamp"],
                                                "properties": {
                                                    "high": { "bsonType": ["double", "int"], "description": "high" },
                                                    "low": { "bsonType": ["double", "int"], "description": "low" },
                                                    "open": { "bsonType": ["double", "int"], "description": "open" },
                                                    "close": { "bsonType": ["double", "int"], "description": "close" },
                                                    "volume": { "bsonType": ["double", "int"], "description": "volume" },
                                                    // Javascript casts all numbers to a double so use that for numbers
                                                    "openTimestamp": { "bsonType": ["double", "int"], "description": "openTimestamp" }
                                                }
                                            }
                                        }
                                    })];
                                case 1:
                                    candleCollection = _a.sent();
                                    console.log("Created collection " + collectionName + " in candles db");
                                    resolve(candleCollection);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    Database.prototype.initialiseCoinStats = function (coins) {
        return __awaiter(this, void 0, void 0, function () {
            var statsCollections, coinStatsExists, coinStatsCollection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbReference.statsDb.listCollections().toArray()];
                    case 1:
                        statsCollections = _a.sent();
                        coinStatsExists = statsCollections.find(function (_a) {
                            var name = _a.name;
                            return name === "coinStats";
                        });
                        if (!!coinStatsExists) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createCoinStats()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.dbReference.statsDb.collection("coinStats")];
                    case 4:
                        coinStatsCollection = _a.sent();
                        return [2 /*return*/, Promise.all(coins.map(function (_a) {
                                var name = _a.name, symbol = _a.symbol, exchanges = _a.exchanges;
                                var latestStats = { open: { daily: 0 }, volume: 0, }; // Calculate these from candles
                                return coinStatsCollection.findOneAndUpdate({ name: name, symbol: symbol, exchanges: exchanges.map(function (_a) {
                                        var exchangeName = _a.exchangeName;
                                        return exchangeName;
                                    }) }, { "$set": {
                                        name: name,
                                        symbol: symbol,
                                        lastUpdate: 0,
                                        exchanges: exchanges.map(function (_a) {
                                            var exchangeName = _a.exchangeName;
                                            return exchangeName;
                                        })
                                    }, }, { upsert: true } // insert the document if it does not exist
                                );
                            }))];
                }
            });
        });
    };
    // Container pointing to more nuanced stats
    Database.prototype.createCoinStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        var coinStatsCollection;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.dbReference.statsDb.createCollection('coinStats', {
                                        'validator': {
                                            '$jsonSchema': {
                                                'bsonType': 'object',
                                                "description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
                                                'required': ['lastUpdate', 'name', 'symbol', 'open', "volume"],
                                                'properties': {
                                                    "lastUpdate": { "bsonType": ["double", "int"] },
                                                    "name": { "bsonType": "string" },
                                                    "symbol": { "bsonType": "string" },
                                                    "exchanges": { "bsonType": "array" }
                                                }
                                            }
                                        }
                                    })];
                                case 1:
                                    coinStatsCollection = _a.sent();
                                    console.log('Created collection coinStats in stats db');
                                    resolve(coinStatsCollection);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    Database.prototype.initialiseCoinExchangeStats = function (coins) {
        return __awaiter(this, void 0, void 0, function () {
            var statsCollections, promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbReference.statsDb.listCollections().toArray()];
                    case 1:
                        statsCollections = _a.sent();
                        promises = coins.map(function (_a) {
                            var name = _a.name, symbol = _a.symbol, exchanges = _a.exchanges;
                            return Promise.all(exchanges.map(function (_a) {
                                var exchangeName = _a.exchangeName, pairs = _a.pairs;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var collName, collExists, coll;
                                    var _this = this;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                collName = name + ":" + symbol + ":" + exchangeName;
                                                collExists = statsCollections.find(function (_a) {
                                                    var name = _a.name;
                                                    return name === collName;
                                                });
                                                if (!!collExists) return [3 /*break*/, 2];
                                                return [4 /*yield*/, this.createCoinExchangeStats(name, symbol, exchangeName)];
                                            case 1:
                                                _b.sent();
                                                _b.label = 2;
                                            case 2: return [4 /*yield*/, this.dbReference.statsDb.collection(collName)];
                                            case 3:
                                                coll = _b.sent();
                                                return [2 /*return*/, Promise.all(pairs.map(function (pair) { return __awaiter(_this, void 0, void 0, function () {
                                                        var statsForPair, dailyCandleCollName, dailyCandleColl, fifteenMinCandles;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0: return [4 /*yield*/, coll.findOne({ pair: pair })];
                                                                case 1:
                                                                    statsForPair = _a.sent();
                                                                    if (!!statsForPair) return [3 /*break*/, 3];
                                                                    return [4 /*yield*/, coll.insertOne({
                                                                            pair: pair,
                                                                            lastUpdate: new Date().getTime(),
                                                                            simpleStats: {
                                                                                daily: {
                                                                                    open: 0,
                                                                                    close: 0,
                                                                                    high: 0,
                                                                                    low: 0,
                                                                                    volume: 0,
                                                                                }
                                                                            },
                                                                        })];
                                                                case 2:
                                                                    statsForPair = _a.sent();
                                                                    _a.label = 3;
                                                                case 3:
                                                                    dailyCandleCollName = name + ":" + pair + ":" + "15m" + ":" + constants_1.DAY + ":" + exchangeName;
                                                                    return [4 /*yield*/, this.dbReference.candlesDb.collection(dailyCandleCollName)];
                                                                case 4:
                                                                    dailyCandleColl = _a.sent();
                                                                    return [4 /*yield*/, dailyCandleColl.find().toArray()];
                                                                case 5:
                                                                    fifteenMinCandles = _a.sent();
                                                                    if (fifteenMinCandles.length !== 0) {
                                                                        // Calculate the simple stats
                                                                        statsForPair.daily = __assign({ open: fifteenMinCandles.first().open, close: fifteenMinCandles.last().close }, fifteenMinCandles.reduce(function (totals, candle) { return ({
                                                                            high: candle.high > totals.high || !candle.high ? candle.high : totals.high,
                                                                            low: candle.low < totals.low || !candle.low ? candle.low : totals.low,
                                                                            volume: totals.volume + candle.volume,
                                                                        }); }, { volume: 0, high: 0, low: 0 }));
                                                                    }
                                                                    return [4 /*yield*/, coll.findOneAndUpdate({ pair: pair }, { "$set": statsForPair })];
                                                                case 6:
                                                                    _a.sent();
                                                                    console.log("Initialised stats for " + name + ":" + symbol + ":" + exchangeName + ":" + pair);
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    }); }))];
                                        }
                                    });
                                });
                            }));
                        });
                        return [2 /*return*/, Promise.all(promises)];
                }
            });
        });
    };
    /**
     * Contains an array of 24hr price and volume info for each pair on the exchange
     */
    Database.prototype.createCoinExchangeStats = function (name, symbol, exchange) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        var coinStatsCollection;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.dbReference.statsDb.createCollection(name + ":" + symbol + ":" + exchange, {
                                        'validator': {
                                            '$jsonSchema': {
                                                'bsonType': 'object',
                                                "description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
                                                'required': ['lastUpdate', "pair", 'simpleStats',],
                                                'properties': {
                                                    "lastUpdate": { "bsonType": ["double", "int"] },
                                                    "pair": { "bsonType": "string" },
                                                    "simpleStats": {
                                                        "bsonType": "object",
                                                        "required": ["daily"],
                                                        "properties": {
                                                            "daily": {
                                                                "bsonType": "object",
                                                                "required": ["open", "close", "high", "volume", "low"],
                                                                "properties": {
                                                                    "open": { "bsonType": ["double", "int"] },
                                                                    "close": { "bsonType": ["double", "int"] },
                                                                    "high": { "bsonType": ["double", "int"] },
                                                                    "volume": { "bsonType": ["double", "int"] },
                                                                    "low": { "bsonType": ["double", "int"] },
                                                                }
                                                            },
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    })];
                                case 1:
                                    coinStatsCollection = _a.sent();
                                    console.log("Created coinExchangeStats collection " + name + ":" + symbol + ":" + exchange + " in stats db");
                                    resolve(coinStatsCollection);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    return Database;
}());
module.exports = new Database();

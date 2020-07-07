"use strict";
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
var dbUrl = 'mongodb://localhost:27017';
var STATS_DB_NAME = 'stats';
var CANDLES_DB_NAME = "candles";
var client = new mongodb_1.MongoClient(dbUrl);
var Database = /** @class */ (function () {
    function Database() {
        this.dbReference = {
            statsDb: null,
            candlesDb: null,
        };
    }
    Database.prototype.start = function (coins) {
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
                        return [4 /*yield*/, this.initialise(coins)];
                    case 4:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Database.prototype.initialise = function (coins) {
        return __awaiter(this, void 0, void 0, function () {
            var statsCollections, statsSimpleExists, statsSimpleCollection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbReference.statsDb.listCollections().toArray()];
                    case 1:
                        statsCollections = _a.sent();
                        statsSimpleExists = statsCollections.find(function (_a) {
                            var name = _a.name;
                            return name === "stats:simple";
                        });
                        if (!!statsSimpleExists) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createStatsSimple()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.dbReference.statsDb.collection("stats:simple")];
                    case 4:
                        statsSimpleCollection = _a.sent();
                        coins.forEach(function (coin) {
                            statsSimpleCollection.findOneAndUpdate({ name: coin.name, symbol: coin.symbol }, { "$setOnInsert": {
                                    name: coin.name,
                                    symbol: coin.symbol,
                                    open: 0, volume: 0, lastUpdate: 0
                                } }, { upsert: true } // insert the document if it does not exist
                            );
                        });
                        return [2 /*return*/];
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
    /**
     * Contains 24hr price and volume info
     */
    Database.prototype.createStatsSimple = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        var statsSimpleCollection;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.dbReference.statsDb.createCollection('stats:simple', {
                                        'validator': {
                                            '$jsonSchema': {
                                                'bsonType': 'object',
                                                "description": "Updated if time a new candle is added AND it has been at least 5 minutes after last update",
                                                'required': ['lastUpdate', 'name', 'symbol', 'open', "volume"],
                                                'properties': {
                                                    "lastUpdate": { "bsonType": ["double", "int"] },
                                                    "name": { "bsonType": "string" },
                                                    "symbol": { "bsonType": "string" },
                                                    "open": { "bsonType": ["double", "int"] },
                                                    "volume": { "bsonType": ["double", "int"], "description": "Dollar aggregate volume accross all exchanges and pairs" },
                                                }
                                            }
                                        }
                                    })];
                                case 1:
                                    statsSimpleCollection = _a.sent();
                                    console.log('Created collection stats:simple in stats db');
                                    resolve(statsSimpleCollection);
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

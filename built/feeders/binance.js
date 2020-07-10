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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastCandles = exports.start = void 0;
var binance_api_node_1 = require("binance-api-node");
var Events = require("../events/events");
var _ = require("lodash");
var constants_1 = require("../utils/constants");
var helpers_1 = require("../utils/helpers");
var binance = binance_api_node_1.default();
function start(coins) {
    console.log("Starting Binance Feeder");
    // Go through all coins and extract their Binance pairs
    var binancePairs = coins.map(function (_a) {
        var _b;
        var exchanges = _a.exchanges, name = _a.name;
        var pairs = (_b = exchanges.find(function (_a) {
            var exchangeName = _a.exchangeName;
            return exchangeName === "Binance";
        })) === null || _b === void 0 ? void 0 : _b.pairs;
        return pairs && { pairs: pairs, name: name };
    }).filter(function (item) { return item; });
    // For each pair map it to the coins name
    var pairToNameMap = binancePairs.reduce(function ($map, coin) {
        coin.pairs.forEach(function (pair) { return $map[pair] = coin.name; });
        return $map;
    }, {});
    // Listen to all possible trades for each coin
    var rawPairs = binancePairs.reduce(function ($arr, coin) { return $arr.concat(coin.pairs); }, []);
    binance.ws.trades(rawPairs, function (_a) {
        var price = _a.price, quantity = _a.quantity, maker = _a.maker, eventTime = _a.eventTime, symbol = _a.symbol;
        var parsedTick = {
            price: parseFloat(price),
            volume: parseFloat(quantity),
            exchange: "Binance",
            isBuy: maker,
            timestamp: eventTime,
            pair: symbol,
            name: pairToNameMap[symbol],
        };
        Events.emit('NEW_TICK', parsedTick);
    });
}
exports.start = start;
/**
 * Get the past candles for a given coin from the startTime
 * @param coin
 * @param candleTimeframe
 * @param startTime
 *
 * @returns {*} - A stream takes a callback which we pass the candles into
 */
function getPastCandles(pair, candleTimeframe, startTime, callback, endTime) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var gotAllCandles, candlesCount, rawCandles, formattedCandles;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    gotAllCandles = false;
                    candlesCount = 0;
                    _b.label = 1;
                case 1:
                    if (!!gotAllCandles) return [3 /*break*/, 4];
                    return [4 /*yield*/, binance.candles({ symbol: pair, interval: candleTimeframe, limit: 500, startTime: startTime })];
                case 2:
                    rawCandles = _b.sent();
                    formattedCandles = rawCandles.map(function (_a) {
                        var openTimestamp = _a.openTime, open = _a.open, high = _a.high, low = _a.low, close = _a.close, volume = _a.volume;
                        var Candle = {
                            openTimestamp: openTimestamp,
                            open: +open,
                            high: +high,
                            low: +low,
                            close: +close,
                            volume: +volume,
                        };
                        return Candle;
                    });
                    candlesCount += formattedCandles.length;
                    gotAllCandles = rawCandles.length === 0 || startTime >= endTime;
                    startTime = ((_a = _.last(rawCandles)) === null || _a === void 0 ? void 0 : _a.openTime) + constants_1.stringToTimeframe[candleTimeframe];
                    if (!gotAllCandles && rawCandles.length === 0)
                        throw new Error("Got zero candles even though we have not got all candles yet");
                    callback(_.cloneDeep(formattedCandles), { done: gotAllCandles, candlesCount: candlesCount });
                    return [4 /*yield*/, helpers_1.sleep(4000)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getPastCandles = getPastCandles;

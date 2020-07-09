"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToTimeframe = exports.DAY = exports.FIFTEEN_MINUTES = exports.FIVE_MINUTES = void 0;
exports.FIVE_MINUTES = 10 * 1000;
exports.FIFTEEN_MINUTES = exports.FIVE_MINUTES * 3;
exports.DAY = 24 * 60 * 60 * 1000;
exports.stringToTimeframe = {
    "5m": exports.FIVE_MINUTES,
    "15m": exports.FIFTEEN_MINUTES,
    "1d": exports.DAY,
};

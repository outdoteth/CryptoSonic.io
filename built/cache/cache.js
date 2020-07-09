"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.cacheDb = void 0;
var redis = require("redis");
exports.cacheDb = redis.createClient();
function start() {
    exports.cacheDb.on("error", function (error) {
        throw new Error(error);
    });
}
exports.start = start;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
var _ = require("lodash");
exports.sleep = function (duration) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, duration);
    });
};
// @ts-ignore
Array.prototype.last = function () { return _.cloneDeep(this[this.length - 1]); };
// @ts-ignore
Array.prototype.first = function () { return _.cloneDeep(this[0]); };

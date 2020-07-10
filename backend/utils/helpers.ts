import * as _ from "lodash";

export const sleep = duration => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, duration);
    });  
}

declare global {
    interface Array<T> {
        last(this: T[]): T;
        first(this: T[]): T;
    }
}

// @ts-ignore
Array.prototype.last = function() { return _.cloneDeep(this[this.length - 1]); };

// @ts-ignore
Array.prototype.first = function() { return _.cloneDeep(this[0]); };
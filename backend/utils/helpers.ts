import * as _ from "lodash";

export const sleep = duration => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, duration);
    });  
}


// @ts-ignore
Array.prototype.last = $arr => _.cloneDeep($arr[$arr.length - 1]);

// @ts-ignore
Array.prototype.first = $arr => _.cloneDeep($arr[0]);
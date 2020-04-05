"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//class EventsEmitter extends EventEmitter {}
//const Events = new EventsEmitter();
var events_1 = require("events");
var EventsEmitter = /** @class */ (function (_super) {
    __extends(EventsEmitter, _super);
    function EventsEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EventsEmitter;
}(events_1.EventEmitter));
var Events = new EventsEmitter();
module.exports = Events;

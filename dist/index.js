"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = __importDefault(require("./chocolog/log"));
var log_2 = require("./chocolog/log");
exports.ChocoLog = log_2.ChocoLog;
__export(require("./chocolog/tsmap"));
exports.default = log_1.default;
exports.cLog = log_1.default;
//# sourceMappingURL=index.js.map
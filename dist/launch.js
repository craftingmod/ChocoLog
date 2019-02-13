"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dongbak_1 = require("./dongbak");
const index_1 = __importStar(require("./index"));
console.log("Hello World");
// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function run() {
    // tslint:disable-next-line
    const cssurl = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css";
    const vscss = await new index_1.ChocoLog().setCodeTheme(cssurl);
    // const log = new ChocoLog()
    await index_1.default.setCodeTheme(cssurl);
    await index_1.default.i("Information");
    await index_1.default.e(new Error("Sample Error"));
    await index_1.default.v("Header is awesome", 7777 + " 덕지덕지해~ " + true);
    await index_1.default.w("한글지원", true);
    await index_1.default.d(dongbak_1.dongbak.substring(0, 200));
    await index_1.default.code(`
require('trace');
require('clarify');

const crypto = require('crypto');
const fs = require('fs');

fs.readFile(__filename, function () {
  crypto.randomBytes(256, function () {
    process.nextTick(function () {
      throw new Error('custom error');
    });
  });
});
`);
    for (let i = 0; i < 100; i += 1) {
        await index_1.default.d("Loop " + i);
    }
}
run();
// logUnicode()
async function test() {
    const log = new index_1.ChocoLog();
    await log.setDefaultTheme();
    log.d(5353);
    log.d(true);
    log.d({
        aa: "Kkirodeasu",
        cd: "Holla!",
    });
    log.d(["Hello", "World"]);
    const mapTest = new Map();
    mapTest.set("Test", 1123);
    log.d(mapTest);
}
function logUnicode() {
    for (let i = 0; i <= 255; i += 1) {
        let block = "";
        for (let j = 0; j < 16; j += 1) {
            block += (i * 16 * 16 + j * 16).toString(16).toUpperCase().padStart(4, "0") + " ";
            for (let k = 0; k < 16; k += 1) {
                const n = k + j * 16 + i * 16 * 16;
                if (n >= 0x10000) {
                    break;
                }
                if (i === 0 && j === 9) {
                    break;
                }
                block += String.fromCodePoint(n);
                block += "|";
            }
            block += "\n";
        }
        index_1.default.i("Unicode", block);
    }
}
//# sourceMappingURL=launch.js.map
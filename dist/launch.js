"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dongbak_1 = require("./dongbak");
const index_1 = __importStar(require("./index"));
console.log("Hello World");
// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function run() {
    const cssurl = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css";
    const vscss = await new index_1.ChocoLog().setCodeTheme(cssurl);
    const dongbaks = fs_1.default.readFileSync("./example.js", "utf8");
    // const log = new ChocoLog()
    await index_1.default.setCodeTheme(cssurl);
    await index_1.default.v("끼로데수", {
        aa: 53,
        bb: "안뇽",
        cc: true,
        dd: {
            ee: "haha",
            ff: 53,
        },
    });
    await index_1.default.v(5353, 7777 + " 덕지덕지해~ " + true);
    await index_1.default.w("한글", true);
    await index_1.default.wtf(7777);
    await index_1.default.e(new Error("Hello!"));
    await index_1.default.code(dongbaks);
    await index_1.default.d(dongbak_1.dongbak);
}
run();
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
/*
for (let i = 0; i < dongbaks.length; i += 1) {
    const ln = unicodeLn(dongbaks[i])
    let k = 0
    let u = 0
    let part:string
    while (k + u < ln) {
        part = substringMono(dongbaks[i], k, Math.min(ln, k + u + process.stdout.columns))
        u = unicodeLn(part)
    }
    k += u
    u = 0
    splits.push(part)
    console.log(part)
}
*/
function logUnicode() {
    for (let i = 0; i <= 255; i += 1) {
        for (let j = 0; j < 16; j += 1) {
            process.stdout.write((i * 16 * 16 + j * 16).toString(16).toUpperCase().padStart(4, "0") + " ");
            for (let k = 0; k < 16; k += 1) {
                const n = k + j * 16 + i * 16 * 16;
                if (n >= 0x10000) {
                    break;
                }
                if (i === 0 && j === 9) {
                    break;
                }
                process.stdout.write(String.fromCodePoint(n));
                process.stdout.write("|");
            }
            process.stdout.write("\n");
        }
        process.stdout.write("\n==============\n");
    }
}
//# sourceMappingURL=launch.js.map
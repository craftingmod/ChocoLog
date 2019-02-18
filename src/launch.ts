import fs from "fs"
import { dongbak } from "./dongbak"
import Log, { ChocoLog } from "./index"

console.log("Hello World")

// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function run() {
    // tslint:disable-next-line
    const cssurl = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
    const vscss = await new ChocoLog("Test").setCodeTheme(cssurl)
    // const log = new ChocoLog()
    await Log.setCodeTheme(cssurl)
    await Log.i("Information")
    await Log.e(new Error("Sample Error"))
    await Log.v("Header is awesome", 7777 + " 덕지덕지해~ " + true)
    await Log.w("한글지원", true)
    await Log.d(dongbak.substring(0, 200))
    await Log.code(`
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
`)
    for (let i = 0; i < 100; i += 1) {
        await Log.d("Loop " + i)
    }
}
run()
// logUnicode()
async function test() {
    const log = new ChocoLog("Test")
    await log.setDefaultTheme()
    log.d(5353)
    log.d(true)
    log.d({
        aa: "Kkirodeasu",
        cd: "Holla!",
    })
    log.d(["Hello", "World"])
    const mapTest = new Map<string, number>()
    mapTest.set("Test", 1123)
    log.d(mapTest)
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
interface InterF {
    tesT:number,
}

function logUnicode() {
    for (let i = 0; i <= 255; i += 1) {
        let block:string = ""
        for (let j = 0; j < 16; j += 1) {
            block += (i * 16 * 16 + j * 16).toString(16).toUpperCase().padStart(4, "0") + " "
            for (let k = 0; k < 16; k += 1) {
                const n = k + j * 16 + i * 16 * 16
                if (n >= 0x10000) {
                    break
                }
                if (i === 0 && j === 9) {
                    break
                }
                block += String.fromCodePoint(n)
                block += "|"
            }
            block += "\n"
        }
        Log.i("Unicode", block)
    }
}

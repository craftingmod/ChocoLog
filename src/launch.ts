import chalk from "chalk"
import fs from "fs"
import fetch from "node-fetch"
import { consoleLn } from "./chocolog/monoutil"
import { dongbak } from "./dongbak"
import { ChocoLog, cLog } from "./index"

// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function sample() {
    const log = cLog.getLogger("Sample")
    await log.setDefaultTheme()
    log.enableAll()
    log.use12Hour = true
    // 1. string
    log.d("Hello, World")
    // 2. string with header & content
    log.d("Header", "Content", " is", " awesome!")
    // 3. 5 types of logs
    log.i("Info")
    log.w("Warn")
    log.e("Error")
    log.v("Verbose")
    log.wtf("RIP")
    // 4. paramater as integer or boolean
    log.d("Integer", 1004, true)
    // 5. parameter as Map
    const testMap = new Map<string, string>()
    testMap.set("5353", "Test")
    testMap.set("7777", "afafa")
    testMap.set("578888", "Ahahaha")
    log.d("Map", testMap)
    // 6. parameter as Error
    log.d("Oops", new Error("Hello Error~"))
    // 7. parameter as object
    log.d("Object", {
        first: "1",
        second: 2,
        third: true,
        fourth: () => "hello",
        fifth: {
            recursive: true,
            thinking: "🤔",
        },
    })
    // 8. code
    const css = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
    log.code(await fetch(css).then((v) => v.text()))
    // 9. set log level
    log.setLevel("WARN")
    log.d("I'm not showing!")
    log.w("I'm showing!")
    log.e("Me too o/")
    log.enableAll()
    // end
    log.i("Finish~")
}
sample()
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
class Claz {
    public test = 53
    public hello() {
        // dummy
    }
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
        cLog.i("Unicode", block)
    }
}

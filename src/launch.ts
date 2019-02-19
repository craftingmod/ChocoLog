import fs from "fs"
import { dongbak } from "./dongbak"
import { ChocoLog, cLog } from "./index"

console.log("Hello World")

// tslint:disable-next-line
const Log = cLog.getLogger("tester")
// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function run() {
    // tslint:disable-next-line
    const cssurl = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
    // const log = new ChocoLog()
    await Log.setDefaultTheme()
    Log.enableAll()
    Log.use12Hour = true
    const testMap = new Map<string, string>()
    testMap.set("5353", "Test")
    await Log.v("Object Test", {
        a: 53,
        b: "Hello",
        c: {
            d: "5353",
            e: new Error("Test"),
            f: {
                g: "Recursive",
                h: true,
                i: [53, 77],
            },
            k: testMap,
            i: () => "test",
        },
    })
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

import ansiRegex from "ansi-regex"
import chalk from "chalk"
import fs from "fs"
import fetch from "node-fetch"
import wcwidth from "wcwidth"
import { consoleLn, stripAnsi, substrMono } from "./chocolog/monoutil"
import { dongbak } from "./dongbak"
import { ChocoLog, cLog } from "./index"

// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function sample() {
    const log = cLog.getLogger("Sample")
    // await log.setDefaultTheme()
    cLog.use12Hour = true
    log.enableAll()
    log.use12Hour = true
    const css = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/agate.css"
    cLog.setCssTheme(await fetch(css).then((v) => v.text()))
    // 1
    cLog.d("🤔")
    cLog.d("thinking face", "🤔")
    cLog.d("faces", "🤔", "🙃", "😗")
    // 2
    cLog.i("Primitives", 37, " ", true, " ", null)
    cLog.i("Object", {
        thinking: "🤔",
        upsideDown: "🙃",
    })
    cLog.i(["LoLInsect", "Detected"])
    const mp = new Map<string, string>()
    mp.set("Top", "Teemo")
    mp.set("Mid", "Riven")
    mp.set("ADCarry", "Ezreal")
    cLog.i("Loading", mp)
    cLog.i("Oops", new Error("Trolling"))
    cLog.i("Fn", (str:string) => `Hello, ${str}!`)
    const cd = fs.readFileSync(process.cwd() + "/example.js", { encoding: "utf8" })
    cLog.d(new Date(Date.now()))
    const code = cLog.code(cd, "Code Sample", "javascript")
    cLog.d("Length", code.length)

    // 9. set log level
    // log.setLevel("WARN")
    log.v("Verbose")
    log.d("Debug")
    log.i("Info")
    log.w("Warning")
    log.e("Error")
    log.wtf("Assert")
    // log.enableAll()
    // end
    log.i("Finish~")
}
function perform() {
    const start = Date.now()
    cLog.d("Performance Test")
    console.log(Date.now() - start)
}
// perform()
sample()
// logUnicode()
async function test() {
    const log = new ChocoLog("Test")
    log.d(5353)
    log.d(true)
    log.d({
        aa: "Kkirodeasu",
        cd: "Holla!",
    })
    const mp = new Map<string, string>()
    mp.set("Top", "Teemo")
    mp.set("Mid", "Riven")
    mp.set("ADCarry", "Ezreal")
    cLog.i("Loading", mp)
    // Error
    cLog.i("Oops", new Error("Trolling"))
    // Function.. (not correctly)
    cLog.i("Fn", (str:string) => `Hello, ${str}!`)
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

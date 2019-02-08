import chalk from "chalk"
import emphasize, { Sheet } from "emphasize"
import fs from "fs"
import stripAnsi from "strip-ansi"
import wcwidth from "wcwidth"
import { dongbak } from "./dongbak"
import { ChocoLog, substrMono, unicodeLn } from "./log"
import { styledCSS } from "./styledcss"

console.log("Hello World")

// https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css
async function run() {
    const cssurl = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
    const vscss = await new ChocoLog().setCodeTheme(cssurl)
    const dongbaks = emphasize.highlightAuto(fs.readFileSync("./example.js", "utf8"), vscss as Sheet).value.split("\n")
    const splits:string[] = []
    const test = substrMono("늬 집은 이런거 없제잉", 3, 9)
    console.log(wcwidth("\u{1B}"))
    console.log(test)
    for (const str of dongbaks) {
        const column = process.stdout.columns
        for (let i = 0; i < stripAnsi(str).length; true) {
            const sub = substrMono(str, i, column - 1)
            const part = sub.content + "|"
            i += sub.original.length
            console.log(JSON.stringify(sub.lastStyle))
            splits.push(part)
        }
    }
    console.log(splits.join("\n"))
}
run()
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
            process.stdout.write((i * 16 * 16 + j * 16).toString(16).toUpperCase().padStart(4, "0") + " ")
            for (let k = 0; k < 16; k += 1) {
                const n = k + j * 16 + i * 16 * 16
                if (n >= 0x10000) {
                    break
                }
                if (i === 0 && j === 9) {
                    break
                }
                process.stdout.write(String.fromCodePoint(n))
                process.stdout.write("|")
            }
            process.stdout.write("\n")
        }
        process.stdout.write("\n==============\n")
    }
}

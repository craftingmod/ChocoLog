import ansiParser from "ansi-parser"
import ansiRegex from "ansi-regex"
import stripAnsi from "strip-ansi"
import wcwidth from "wcwidth"
/**
 * Calculate for console print's length
 * @param text Text
 */
export function consoleLn(text:string) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.")
    }
    let ln = 0
    const arr = [...stripAnsi(text)]
    for (const char of arr) {
        if (char === "\t") {
            ln = Math.ceil((ln + 1) / 4) * 4
            continue
        }
        ln += wcwidth(char)
    }
    return ln
}
/**
 * Monospace version of padStart
 * @param text
 * @param length
 * @param fillText
 */
export function padStartMono(text:string, length:number, fillText = " ") {
    const monoLn = consoleLn(text)
    return text.padStart(text.length + Math.max(0, length - monoLn), fillText)
}
/**
 * Monospace version of padEnd
 * @param text
 * @param length
 * @param fillText
 */
export function padEndMono(text:string, length:number, fillText = " ") {
    const monoLn = consoleLn(text)
    return text.padEnd(text.length + Math.max(0, length - monoLn), fillText)
}
/**
 * .
 * @param text To substr text with ANSI
 * @param start start position **without ANSI**
 * @param length Max length to substr **without ANSI**
 */
export function substrMono(text:string, start:number, length:number) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.")
    }
    // https://stackoverflow.com/a/34717402
    const charsets = [...stripAnsi(text)]
    // https://stackoverflow.com/questions/45803829/memory-overhead-of-typed-arrays-vs-strings
    // tslint:disable-next-line
    let out: string[] = []
    // ansi escape positions
    const ansiCodes:string[] = ansiRegex().test(text) ? text.match(ansiRegex()) : []
    const ansiPosInfo = text.split(ansiRegex()).map((v) => v.length)
    for (let i = 0; i < ansiPosInfo.length; i += 1) {
        if (i >= 1) {
            ansiPosInfo[i] += ansiPosInfo[i - 1]
        }
    }
    // process
    const tab = "\t"
    let totalLn = 0
    let untilLn = 0
    for (let i = 0; i < charsets.length; i += 1) {
        const char = charsets[i]
        const ln = wcwidth(char)
        if (char === tab) {
            totalLn = Math.ceil((totalLn + 1) / 4) * 4
        } else {
            totalLn += ln
        }
        if (i < start) {
            continue
        } else if (untilLn === 0) {
            untilLn = totalLn - ln + length
        }
        if (totalLn <= untilLn) {
            out.push(char)
        } else {
            break
        }
    }
    // add ansi after process
    const orgText = out.join("")
    let asOffset = 0
    for (let i = 0; i < ansiCodes.length; i += 1) {
        const insert = ansiPosInfo[i] + asOffset
        if (insert < out.length) {
            out.splice(insert, 0, ansiCodes[i])
        }
        asOffset += 1
    }
    const styleText = out.join("")
    return {
        original: orgText,
        content: styleText,
        lastStyle: ansiParser.getAtIndex(styleText, orgText, orgText.length - 1).style,
    }
}

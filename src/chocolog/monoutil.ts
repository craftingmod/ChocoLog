import ansiParser from "ansi-parser"
import ansiRegex from "ansi-regex"
import emojiRegex from "emoji-regex"
import wcwidth from "wcwidth"
/**
 * Calculate for console print's length
 * @param text Text
 */
export const ansiExp = ansiRegex()
const tabSize = 8
const emojiWidth = (process.env.EMOJI_WIDTH !== undefined) ? Number.parseInt(process.env.EMOJI_WIDTH) : -1
export function consoleLn(text:string) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.")
    }
    if (text.length === 1) {
        return wcwidth(text)
    }
    let ln = 0
    const arr = [...stripAnsi(text)]
    for (const char of arr) {
        if (char === "\t") {
            ln = Math.ceil((ln + 1) / tabSize) * tabSize
            continue
        }
        if (emojiWidth >= 0) {
            const emojiExec = emojiRegex().exec(char)
            if (emojiExec != null) {
                ln += [...emojiExec[0]].length * emojiWidth
                // ln += wcwidth(char)
                continue
            }
        }
        ln += wcwidth(char)
    }
    return ln
}
export function stripAnsi(text:string) {
    return text.replace(ansiExp, "")
}
export function makeBlank(length:number) {
    // tslint:disable
    let out = new String()
    for (let i = 0; i < length; i += 1) {
        out += " "
    }
    return out.toString()
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
    let out:string[] = []
    // ansi escape positions
    const ansiCodes:string[] = ansiExp.test(text) ? text.match(ansiExp) : []
    const ansiPosInfo = text.split(ansiExp).map((v) => v.length)
    for (let i = 0; i < ansiPosInfo.length; i += 1) {
        if (i >= 1) {
            ansiPosInfo[i] += ansiPosInfo[i - 1]
        }
    }
    // process
    const tab = "\t"
    let totalLn = 0
    let skippedCount = 0
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
            skippedCount += 1
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
        const insert = ansiPosInfo[i] + asOffset - skippedCount
        if (insert >= 0 && insert < out.length) {
            out.splice(insert, 0, ansiCodes[i])
            asOffset += 1
        }
    }
    const styleText = out.join("")
    return {
        original: orgText,
        content: styleText,
        lastStyle: ansiParser.getAtIndex(styleText, orgText, orgText.length - 1).style,
    }
}

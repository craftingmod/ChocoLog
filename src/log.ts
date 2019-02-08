import ansiParser from "ansi-parser"
import ansiRegex from "ansi-regex"
import chalk, { Chalk } from "chalk"
import Color from "color"
import emphasize, { Sheet } from "emphasize"
import fetch from "node-fetch"
import stripAnsi from "strip-ansi"
import wcwidth from "wcwidth"
import { Serializable } from "./types/serialize"

const defaultCodeCSS = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
type LikeString = boolean | number | string | Buffer | Serializable
export class ChocoLog {
    protected codeBackground = "#222222"
    protected codeTextColor = "#ffffff"
    protected codeStyle:Sheet = null

    protected headerSize = 30
    protected middleSize = 3

    protected get width() {
        return process.stdout.columns
    }
    // protected headerChalk = chalk.
    /*
    =====================================================
    = Define default methods
    =====================================================
    */
    public d(_title:LikeString, _desc?:LikeString) {
        const [title, desc] = this.fallbackParam(_title, _desc)
        this.printSimple(title, desc, {
            tagName: "D",
            header: chalk.greenBright,
        })
    }
    /*
    =====================================================
    = Theme Part
    =====================================================
    */
    public async setDefaultTheme() {
        return this.setCodeTheme(defaultCodeCSS)
    }
    /**
     * Set `highlight.js` theme to Emphasize's styleSheet
     *
     * And maybe apply this log.
     *
     * @param css URL or raw css content
     */
    public async setCodeTheme(css:string) {
        if (css.startsWith("http")) {
            css = await fetch(css).then((v) => v.text())
        }
        // background color search
        const queryBack = getFirst(css.match(/\.hljs\s*{[\S\s]+background:.+;\s*?}/))
        if (queryBack != null) {
            let filter = queryBack.match(/background:.+?;/)[0]
            filter = cssToColor(filter)
            this.codeBackground = filter
        }
        // foreground color search
        const queryFore = getFirst(css.match(/\.hljs\s*{[\S\s]+color:.+;\s*?}/))
        if (queryFore != null) {
            let filter = queryFore.match(/color:.+?;/)[0]
            filter = cssToColor(filter)
            this.codeTextColor = filter
        }
        // child style search
        const queries = css.match(/\.hljs-[a-zA-Z\-_,.\s]+?{[\S\s]+?}/g)
        const styles:{[key in string]:Chalk} = {}
        for (const query of queries) {
            // 1. color
            const color = cssToColor(getFirst(query.match(/color:.+;/)))
            const colorBack = cssToColor(getFirst(query.match(/background-color:.+;/)))
            const bold = query.match(/font-weight:\s*bold;/) != null
            const italic = query.match(/font-style:\s*italic;/) != null
            const underline = query.match(/text-decoration:\s*underline;/) != null
            const headers = query.match(/.hljs-.+/ig)
            if (headers == null) {
                continue
            }
            let style:Chalk = chalk
            if (color != null) {
                style = style.hex(color)
            }
            if (colorBack != null) {
                style = style.bgHex(colorBack)
            }
            if (bold) {
                style = style.bold
            }
            if (italic) {
                style = style.italic
            }
            if (underline) {
                style = style.underline
            }
            for (const header of headers) {
                styles[header.replace(".hljs-", "").replace(",", "")] = style
            }
        }
        this.codeStyle = styles
        return styles
    }
    /*
    =====================================================
    = Utility part
    =====================================================
    */
    /**
     * something to string
     * @param obj any
     */
    protected toStr(obj:any) {
        if (obj instanceof Map) {
            return ""
        }
        switch (typeof obj) {
            case "boolean":
            case "number":
            case "bigint":
            case "string":
                return obj.toString()
            case "function":
                return `[Function ${obj.name}]`
            case "undefined":
                return `[undefined]`
            case "object":
                return JSON.stringify(obj, null, 2)
            default:
                return ""
        }
    }
    protected fallbackParam(title:LikeString, desc:LikeString) {
        if (desc == null) {
            desc = this.toStr(title)
            const caller = this.caller(2)
            title = `${caller.fileName}#${caller.funcName}"${caller.line}`
        } else {
            title = this.toStr(desc)
            desc = this.toStr(desc)
        }
        return [title, desc]
    }
    protected encodeCaller(called:Called) {
        return `${called.fileName}#${called.funcName}"${called.line}`
    }
    protected caller(deeper:number):Called {
        const lastEl = <T>(arr:T[]) => arr[arr.length - 1]
        try {
            throw new Error()
        } catch (err) {
            const stack = (err as Error).stack
            const stackes = stack.split("\n")
            const query = stackes[2 + deeper]
            let sourcepath = query.substring(query.indexOf("(") + 1, query.lastIndexOf(")"))
            const lastInfo = lastEl(sourcepath.split(/[\/\\]/ig))
            const sourceLine = lastInfo.substring(lastInfo.indexOf(":"), lastInfo.lastIndexOf(":"))
            let functionName = query.match(/^\s+at.+\(/i)[0]
            functionName = functionName.substring(0, functionName.length - 1).trim()
            functionName = functionName.substring(3, functionName.length)
            sourcepath = lastInfo.substring(0, lastInfo.indexOf(":"))
            return {
                fileName: sourcepath,
                funcName: functionName,
                line: sourceLine,
            }
        }
    }
    protected get timestamp() {
        const time = new Date(Date.now())
        let h = time.getHours()
        const isPM = h >= 12
        if (isPM) {
            h -= 12
        }
        if (h === 0) {
            h = 12
        }
        const pad = (n:number) => n.toString(10).padStart(2, "0")
        const m = time.getMinutes()
        const s = time.getSeconds()
        return `${isPM ? "P" : "A"}${pad(h)}:${pad(m)}:${pad(s)}`
    }
    protected printSimple(header:string, content:string, options:{tagName:string, header:Chalk}) {
        const prefixLn = this.headerSize + this.middleSize
        const caller = this.encodeCaller(this.caller(2))
        const suffixLn = consoleLn(caller) + 4 +
    }
    protected async write(str:string) {
        return new Promise<void>((res, rej) => {
            process.stdout.write(str, () => res())
        })
    }
}
interface Called {
    fileName:string,
    funcName:string,
    line:string,
}
/**
 * Get first element of array
 *
 * Null if non exists
 */
function getFirst<T extends any>(arr:T[]):T {
    if (arr == null || arr.length < 1) {
        return null
    } else {
        return arr[0]
    }
}
/**
 * Css color element to hex color string
 * @param text css text
 */
function cssToColor(text:string) {
    if (text == null) {
        return null
    }
    let filter = text
    filter = filter.substr(filter.indexOf(":") + 1).trimLeft()
    filter = filter.substring(0, filter.lastIndexOf(";"))
    filter = `#${Color(filter).rgbNumber().toString(16).padStart(6, "0").toUpperCase()}`
    return filter
}
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
    for (let i = 0; i < arr.length; i += 1) {
        const char = arr[i]
        if (char === "\t") {
            ln = Math.ceil((ln + 1) / 4) * 4
            continue
        }
        ln += wcwidth(char)
    }
    return ln
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
        original:orgText,
        content:styleText,
        lastStyle:ansiParser.getAtIndex(styleText, orgText, orgText.length - 1).style,
    }
}
function regexIndexOf(text:string, re:RegExp, i = 0) {
    const indexInSuffix = text.slice(i).search(re)
    return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i
}

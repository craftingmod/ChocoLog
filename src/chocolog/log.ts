import ansiParser, { removeAnsi } from "ansi-parser"
import ansiRegex from "ansi-regex"
import chalk, { Chalk } from "chalk"
import Color from "color"
import emphasize, { Sheet } from "emphasize"
import { write } from "fs"
import fs from "fs-extra"
import fetch from "node-fetch"
import StackTrace from "stack-trace"
import stripAnsi from "strip-ansi"
import uuidRand from "uuid/v4"
import wcwidth from "wcwidth"
import { Serializable } from "../types/serialize"
import { consoleLn, padEndMono, substrMono } from "./monoutil"
import TsMap from "./tsmap"
if (isDebug()) {
    // module to extends stacktrace
    // this is MUST require for duplicate stacktrace tracking
    require("trace")
    require("clarify")
}

const defaultCodeCSS = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
type LikeString = boolean | number | string | Buffer | Serializable
export class ChocoLog {
    public name = "chocolog"
    protected codeBackground = "#222222"
    protected codeTextColor = "#ffffff"
    protected codeStyle:Sheet = null

    protected brightDark = "#333333"
    protected defaultTheme = chalk.bgHex("#222222").hex("#eeeeee")
    protected infoTheme = chalk.bgHex("#fce5e5").hex(this.brightDark)

    protected headerSize = 30
    protected middleSize = 3
    protected subpadSize = 1

    protected cwd = process.cwd()

    protected get width() {
        return process.stdout.columns
    }
    protected sourceMap:Map<string, TsMap> = new Map()
    // protected headerChalk = chalk.
    /*
    =====================================================
    = Define default methods
    =====================================================
    */
    public async d(_title:LikeString, _desc?:LikeString) {
        const [title, desc] = await this.fallbackParam(_title, _desc)
        return this.printSimple(title, desc, {
            tagName: "D",
            colorTheme: "#a6db92",
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
    protected async fallbackParam(title:LikeString, desc:LikeString) {
        if (desc == null) {
            desc = this.toStr(title)
            title = `No Title`
        } else {
            title = this.toStr(desc)
            desc = this.toStr(desc)
        }
        return [title, desc]
    }
    protected encodeCaller(called:Called) {
        return `${called.funcName} (${called.fileName}:${called.line}:${called.column})`
    }
    protected async caller(deeper:number) {
        const detailStackes = StackTrace.get()
        const stackes = detailStackes.filter((v, pos) => {
            return detailStackes.findIndex((_v) =>
                _v.getFunctionName() === v.getFunctionName() && _v.getFileName() === v.getFileName())
                === pos
        })
        const query = stackes[1 + deeper]
        return this.decodeStack(query)
    }
    protected async decodeStack(query:StackTrace.StackFrame) {
        // const lastEl = <T>(arr:T[]) => arr[arr.length - 1]
        let sourcepath = query.getFileName()
        // const lastInfo = lastEl(sourcepath.split(/[\/\\]/ig))
        let sourceLine = query.getLineNumber()
        let sourceColumn = query.getColumnNumber()
        const functionName = query.getFunctionName()
        // functionName = functionName.substring(0, functionName.length - 1).trim()
        // functionName = functionName.substring(3, functionName.length)
        // sourcepath = sourcepath.substring(0, sourcepath.indexOf(":"))
        if (!this.sourceMap.has(sourcepath)) {
            const mapPath = `${sourcepath}.map`
            if (await fs.pathExists(mapPath)) {
                this.sourceMap.set(sourcepath, await TsMap.from(mapPath))
            } else {
                this.sourceMap.set(sourcepath, null)
            }
        }
        if (this.sourceMap.get(sourcepath) != null) {
            const sourceMap = this.sourceMap.get(sourcepath)
            const info = sourceMap.decodePoint(sourceLine, sourceColumn)
            if (info != null) {
                sourcepath = sourceMap.getFilePath(this.cwd, false)
                sourceLine = info.tsRow
                sourceColumn = info.tsColumn
            } else {
                console.error(new Error("Info is null!"))
            }
        }
        return {
            fileName: sourcepath,
            funcName: functionName,
            line: sourceLine,
            column: sourceColumn,
        } as Called
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
    protected async printSimple(header:string, content:string, options:{tagName:string, colorTheme:string}) {
        // define external properties
        const caller = this.encodeCaller(await this.caller(2))
        const encHeader = this.defaultTheme.bgHex(options.colorTheme).hex(this.brightDark)(
            this.getHeader(header, options.tagName),
        )
        const middleStyle = this.defaultTheme.bgHex(options.colorTheme).hex(this.brightDark)
        const encMiddle = this.getMiddle(middleStyle, options.tagName)
        const encBottom = this.infoTheme(
            this.getFooter(caller),
        )
        // split to fit
        const splitted = content.split("\n")
        const lines:string[] = []
        const maxLn0 = this.width - consoleLn(encHeader)
        const maxLnA = this.width - consoleLn(encMiddle)
        let lastStyle:string = null
        for (let i = 0; i < splitted.length; i += 1) {
            const line = splitted[i]
            const pureLineLn = stripAnsi(line)
            let maxLn = i === 0 ? maxLn0 : maxLnA
            let k = 0
            while (k < pureLineLn.length) {
                const textInfo = substrMono(line, k, maxLn)
                let text = textInfo.content
                if (lastStyle != null && lastStyle.length > 0) {
                    text = lastStyle + text
                }
                lastStyle = textInfo.lastStyle
                lines.push(text)
                k += textInfo.original.length
                maxLn = maxLnA
            }
        }
        // print
        let out = new String()
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i]
            let thisLine = ""
            if (i === 0) {
                thisLine += encHeader
                thisLine += this.defaultTheme(line.padEnd(line.length + maxLn0 - consoleLn(line)))
            } else {
                thisLine += this.getMiddle(middleStyle, (i + 1).toString().padStart(3))
                if (i < lines.length - 1) {
                    thisLine += this.defaultTheme(line.padEnd(line.length + maxLnA - consoleLn(line)))
                } else {
                    thisLine += this.defaultTheme(line)
                }
            }
            if (i === lines.length - 1) {
                const left = this.width - consoleLn(stripAnsi(thisLine))
                if (left >= consoleLn(encBottom)) {
                    thisLine += encBottom
                } else {
                    thisLine += "\n"
                    thisLine += this.defaultTheme(encBottom.padStart(this.width))
                }
            } else {
                thisLine += "\n"
            }
            out += thisLine
        }
        out += "\n"
        await this.write(out.toString())
    }
    /**
     * Get Header of logger
     *
     * [Timestamp] [Header] [typeInfo]
     * @param header To print header
     * @param typeStr To print type
     */
    protected getHeader(header:string, typeStr:string) {
        const headerCut = substrMono(header, 0, this.headerSize)
        const padLn = headerCut.content.length + this.headerSize - headerCut.original.length
        return `${this.infoTheme(" " + this.timestamp + " ")} ${
            headerCut.content.padStart(padLn)} ${typeStr.padStart(this.middleSize)} `
    }
    protected getMiddle(style:Chalk, typeStr:string) {
        const cutted = substrMono(typeStr, 0, this.headerSize)
        return style(` ${cutted.content.padStart(
            cutted.content.length + this.middleSize - cutted.original.length)} `)
    }
    protected getFooter(encodedCaller:string) {
        return ` ${encodedCaller}`
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
    line:number,
    column:number,
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

function regexIndexOf(text:string, re:RegExp, i = 0) {
    const indexInSuffix = text.slice(i).search(re)
    return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i
}
function isDebug() {
    if (process.env.DEBUG === undefined) {
        return false
    }
    if (process.env.DEBUG === "*") {
        return true
    }
    return false
}
function toStringStack(stack:StackTrace.StackFrame) {
    return `${stack.getFunctionName()} (${stack.getFileName()}:${stack.getLineNumber()}:${stack.getColumnNumber()})`
}

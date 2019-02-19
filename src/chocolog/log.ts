import ansiParser, { removeAnsi } from "ansi-parser"
import ansiRegex from "ansi-regex"
import chalk, { Chalk } from "chalk"
import Color from "color"
import { normal } from "color-blend"
import emphasize, { Sheet } from "emphasize"
import { write } from "fs"
import fs from "fs-extra"
import fetch from "node-fetch"
import path from "path"
import StackTrace from "stack-trace"
import stringify from "stringify-object"
import stripAnsi from "strip-ansi"
import uuidRand from "uuid/v4"
import wcwidth from "wcwidth"
import { asReadonly, DeepReadonly } from "../types/deepreadonly"
import { Serializable, SerializableGeneric, Serializify } from "../types/serialize"
import { LogLv, LogLvStatic } from "./loglv"
import { consoleLn, padEndMono, substrMono } from "./monoutil"
import TsMap from "./tsmap"
if (useOrigin()) {
    // module to extends stacktrace
    // this is MUST require for duplicate stacktrace tracking
    require("trace")
    require("clarify")
}

const defaultCodeCSS = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css"
type _LikeString = Serializable | Map<string | number, Serializable> | Error
type LikeString<S> = S extends _LikeString ? S : SerializableGeneric<S> | any
type MapLikeString<S extends any[]> = {
    [K in keyof S]: LikeString<S[K]>
}

export class ChocoLog {
    protected static defaultLevel = LogLv.ALL
    /**
     * Default name of header
     */
    public name:string
    /**
     * Use AM/PM instead of 24-hours?
     */
    public use12Hour = false
    /**
     * Min header size
     */
    public minHeaderSize = 24
    // ========================================================
    /**
     * Log Levels defines
     */
    public readonly levels = asReadonly({...LogLvStatic})
    /**
     * Current log level
     */
    protected logLevel:LogLv
    /**
     * Code theme store
     */
    protected codeBackground = "#222222"
    protected codeTextColor = "#ffffff"
    protected codeStyle:Sheet = null
    /**
     * General colors (all used to type)
     */
    protected generalColors = {
        back: "#222222",
        text: "#eeeeee",
    }
    protected typedColors = {
        verbose: "#e09db8",
        debug: "#8dc7f4",
        info: "#94e897",
        warn: "#fcc385",
        error: "#f9756b",
        assert: "#f1a5ff",
    }
    /**
     * Default theme
     *
     * Used in text content
     */
    protected get defaultTheme() {
        return chalk.bgHex(this.generalColors.back).hex(this.generalColors.text)
    }

    protected brightDark = "#333333"
    protected infoTheme = chalk.bgHex("#fce5e5").hex(this.brightDark)
    protected lineTheme = chalk.bgHex("#e2e2e2").hex("#111111")

    protected middleSize = 3
    protected subpadSize = 1

    protected cwd = process.cwd()

    protected get width() {
        return process.stdout.columns
    }
    protected get headerSize() {
        return Math.min(this.minHeaderSize, Math.floor(this.width / 4))
    }
    protected sourceMap:Map<string, TsMap> = new Map()
    // protected headerChalk = chalk.
    public constructor(name:string) {
        this.name = name
        this.logLevel = ChocoLog.defaultLevel
    }
    /*
    =====================================================
    = Define default methods
    = Due to callback detector, we should copy-paste code.
    =====================================================
    */
   /**
    * Debug log
    */
    public d<T, D extends any[]>(_title:LikeString<T>, ..._desc:MapLikeString<D>) {
        const [title, desc] = this.fallbackParam(_title, _desc)
        return this.printSimple(title, desc, {
            tagName: "D",
            colorTheme: this.typedColors.debug,
            fontColor: this.generalColors.text,
            level: this.levels.DEBUG,
        })
        // "#a6db92"
    }
    /**
     * Verbose log
     */
    public v<T, D extends any[]>(_title:LikeString<T>, ..._desc:MapLikeString<D>) {
        const [title, desc] = this.fallbackParam(_title, _desc)
        return this.printSimple(title, desc, {
            tagName: "V",
            colorTheme: this.typedColors.verbose,
            fontColor: this.generalColors.text,
            level: this.levels.VERBOSE,
        })
    }
    /**
     * Info log
     */
    public i<T, D extends any[]>(_title:LikeString<T>, ..._desc:MapLikeString<D>) {
        const [title, desc] = this.fallbackParam(_title, _desc)
        return this.printSimple(title, desc, {
            tagName: "I",
            colorTheme: this.typedColors.info,
            fontColor: this.generalColors.text,
            level: this.levels.INFO,
        })
    }
    /**
     * Warning log
     */
    public w<T, D extends any[]>(_title:LikeString<T>, ..._desc:MapLikeString<D>) {
        const [title, desc] = this.fallbackParam(_title, _desc)
        return this.printSimple(title, desc, {
            tagName: "W",
            colorTheme: this.typedColors.warn,
            fontColor: this.generalColors.text,
            level: this.levels.WARN,
        })
    }
    /**
     * Error log
     */
    public e<T, D extends any[]>(_title:LikeString<T>, ..._desc:MapLikeString<D>):Promise<null> {
        const [title, desc] = this.fallbackParam(_title, _desc)
        this.printSimple(title, desc, {
            tagName: "E",
            colorTheme: this.typedColors.error,
            fontColor: this.typedColors.error,
            level: this.levels.ERROR,
        })
        return null
    }
    /**
     * OMG
     */
    public wtf<T, D extends any[]>(_title:LikeString<T>, ..._desc:MapLikeString<D>) {
        let [title, desc] = this.fallbackParam(_title, _desc)
        desc = chalk.hex("#ffcbc6")(desc)
        return this.printSimple(title, desc, {
            tagName: "F",
            colorTheme: this.typedColors.assert,
            fontColor: this.typedColors.assert,
            level: this.levels.ASSERT,
        })
    }
    /**
     * Log programming code with auto formatter
     *
     * used `highlight.js` wrapper `emphasize`
     * @param _code Code string to print (css, js, etc...)
     * @param _title Title of log, not need at normal.
     */
    public code<T>(_code:string, _title?:LikeString<T>) {
        let title:string
        if (_title == null) {
            title = "Code"
        } else {
            title = this.toStr(_title)
        }
        const desc = emphasize.highlightAuto(_code, this.codeStyle).value
        return this.printSimple(title, desc, {
            tagName: "C",
            colorTheme: this.codeTextColor,
            fontColor: this.codeTextColor,
            backColor: this.codeBackground,
            level: this.levels.VERBOSE,
        })
    }
    /*
    =====================================================
    = Theme Part
    =====================================================
    */
    public async setDefaultTheme() {
        await this.setCodeTheme(defaultCodeCSS)
        return this.setCodeTheme(defaultCodeCSS)
    }
    public setGeneralColor(general:Partial<{
        background:string,
        background2:string,
        textColor:string,
    }>) {

    }
    public setTypeColor(typed:Partial<{
        verbose:string,
        debug:string,
        info:string,
        warn:string,
        error:string,
    }>) {

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
    // Level part
    /**
     * Get current loglevel
     *
     * Let's see [loglevel doc](https://www.npmjs.com/package/loglevel)
     */
    public getLevel() {
        return this.logLevel
    }
    /**
     * Set loglevel to `level`
     *
     * Let's see [loglevel doc](https://www.npmjs.com/package/loglevel)
     * @param level The minimum level to want logging
     */
    public setLevel(level:LogLv | keyof typeof LogLvStatic) {
        const setLog = this.decodeLogLevel(level)
        if (setLog === -1) {
            return
        }
        this.logLevel = setLog
    }
    /**
     * Set default loglevel to `level`
     *
     * This doesn't applies copied object but will be copyed object
     * @param level The minimum level to want logging
     */
    public setDefaultLevel(level:LogLv | keyof typeof LogLvStatic) {
        const setLog = this.decodeLogLevel(level)
        if (setLog === -1) {
            return
        }
        ChocoLog.defaultLevel = setLog
    }
    /**
     * Enable all log messages
     *
     * Same as `setLevel(cLog.levels.ALL)`
     *
     * See [loglevel doc](https://www.npmjs.com/package/loglevel)
     */
    public enableAll() {
        this.logLevel = LogLv.ALL
    }
    /**
     * Disable all log messages
     *
     * Same as `setLevel(cLog.levels.SLIENT)`
     *
     * See [loglevel doc](https://www.npmjs.com/package/loglevel)
     */
    public disableAll() {
        this.logLevel = LogLv.SILENT
    }
    /*
    ==== Clone Part
    */
    public getLogger(name:string):ChocoLog {
        const cloned = new ChocoLog(name)
        // level
        cloned.setLevel(ChocoLog.defaultLevel)
        // code style
        cloned.codeStyle = this.codeStyle
        cloned.codeTextColor = this.codeTextColor
        // color theme
        cloned.generalColors = {...this.generalColors}
        cloned.typedColors = {...this.typedColors}
        // etc conf
        cloned.use12Hour = this.use12Hour
        cloned.minHeaderSize = this.minHeaderSize
        return cloned
    }
    /**
     * The only part to need "File IO"
     * @param err
     */
    protected errorToString(err:Error) {
        const rawStacks = this.filterStack(StackTrace.parse(err))
        const stackes:string[] = []
        for (const stack of rawStacks) {
            stackes.push(this.encodeCaller(this.decodeStack(stack)))
        }
        return `${err.name} : ${err.message}\n${stackes.map((v) => `  at ${v}`).join("\n")}`
    }
    protected decodeLogLevel(level:LogLv | keyof typeof LogLvStatic) {
        if (typeof level === "string") {
            for (const [key, value] of Object.entries(this.levels)) {
                if (key.toUpperCase() === level.toUpperCase()) {
                    return value as LogLv
                }
            }
        }
        return -1
    }
    /**
     * something to string
     * @param obj any
     */
    protected toStr(obj:unknown, beauty = true):string {
        const forceIndent = (str:string, indentInfo:string) => {
            const blank = indentInfo.match(/^\s*/i)[0]
            return str.split("\n").map((v, i) => i === 0 ? v : blank + v).join("\n")
        }
        const toJSONOpt = {
            indent: "  ",
            singleQuotes: false,
            transform: (o:object,prop:string | number | symbol, value:string) => {
                if (o[prop] instanceof Error) {
                    return forceIndent(`"${this.errorToString(o[prop])}"`, value)
                } else if (o[prop] instanceof Map) {
                    const toObj = {}
                    for (const [k, v] of o[prop].entries()) {
                        toObj[k] = v
                    }
                    return forceIndent(stringify(toObj, toJSONOpt), value)
                } else {
                    return value
                }
            },
        }
        if (obj === null) {
            if (beauty) {
                return chalk.italic("null")
            } else {
                return "null"
            }
        }
        if (obj === undefined) {
            if (beauty) {
                return chalk.italic("undefined")
            } else {
                return "undefined"
            }
        }
        if (obj instanceof Map || typeof obj === "object") {
            const out = {}
            let entries:IterableIterator<[number | string, unknown]> | Array<[number | string, unknown]>
            if (obj instanceof Map) {
                entries = obj.entries()
            } else {
                entries = Object.entries(obj)
            }
            for (const [key, value] of entries) {
                out[key] = this.toStr(value, false)
            }
            if (beauty) {
                return this.beautyJSON(stringify(obj, toJSONOpt))
            } else {
                return stringify(obj, toJSONOpt)
            }
        }
        if (obj instanceof Error) {
            return this.errorToString(obj)
        }
        switch (typeof obj) {
            case "string":
                return obj
            case "boolean":
            case "number":
            case "bigint":
            return obj.toString()
        }
        /*
                    case "function":
                return `[Function ${obj.name}]`
            case "undefined":
                return `[undefined]`
            case "object": {
                return stringify(obj, {
                    indent: "  ",
                    singleQuotes: false,
                })
            }
            default:
                return ""
        */
        if (typeof obj === "function") {
            if (beauty) {
                return this.beautyJSON(stringify(obj, toJSONOpt))
            } else {
                return stringify(obj, toJSONOpt)
            }
        }
        if (typeof obj === "undefined") {
            return chalk.italic("undefined")
        }
        return ""
    }
    protected fallbackParam(title:unknown, desc:Array<unknown>) {
        // tslint:disable-next-line
        let descStr = ""
        if (desc == null || desc.length <= 0) {
            descStr = this.toStr(title)
            title = this.name.length < 1 ? ` ` : this.name
        } else {
            title = this.toStr(title)
            for (const str of desc) {
                let _str = this.toStr(str)
                if (_str.indexOf("\n") >= 0 && !_str.startsWith("\n")) {
                    _str = "\n" + _str
                }
                descStr += _str
            }
        }
        if (!ansiRegex().test(descStr)) {
            descStr = this.beautyJSON(descStr)
        }
        let _title = title as string
        if (_title.indexOf("\n") >= 0) {
            _title = _title.replace(/\s*\n\s*/ig, "")
        }
        return [_title, descStr]
    }
    protected encodeCaller(called:Called) {
        return `${called.funcName} (${called.fileName}:${called.line}:${called.column})`
    }
    protected caller(deeper:number) {
        const stackes = this.filterStack(StackTrace.get())
        if (deeper + 1 >= stackes.length) {
            return null
        }
        const query = stackes[1 + deeper]
        return this.decodeStack(query)
    }
    protected filterStack(stacktrace:StackTrace.StackFrame[]) {
        return stacktrace.filter((v, pos) => {
            return stacktrace.findIndex((_v) =>
                _v.getFunctionName() === v.getFunctionName() && _v.getFileName() === v.getFileName())
                === pos
        })
    }
    protected decodeStack(query:StackTrace.StackFrame) {
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
            if (fs.pathExistsSync(mapPath)) {
                this.sourceMap.set(sourcepath, TsMap.from(mapPath))
            } else {
                this.sourceMap.set(sourcepath, null)
            }
        }
        if (this.sourceMap.get(sourcepath) != null) {
            const sourceMap = this.sourceMap.get(sourcepath)
            const info = sourceMap.decodePoint(sourceLine, sourceColumn)
            if (info != null) {
                sourcepath = path.relative(this.cwd, sourceMap.getFilePath())
                sourceLine = info.tsRow
                sourceColumn = info.tsColumn
            } else {
                console.error(new Error("Info is null!"))
            }
        } else {
            sourcepath = path.relative(this.cwd, sourcepath)
        }
        if (!sourcepath.startsWith(".")) {
            sourcepath = `.${path.sep}${sourcepath}`
        }
        return {
            fileName: sourcepath,
            funcName: functionName,
            line: sourceLine,
            column: sourceColumn,
        } as Called
    }
    protected beautyCode(code:string) {
        return emphasize.highlightAuto(code, this.codeStyle).value
    }
    protected beautyJSON(json:string) {
        return emphasize.highlight("json", json, this.codeStyle).value
    }
    protected get timestamp() {
        const time = new Date(Date.now())
        let h = time.getHours()
        const isPM = h >= 12
        if (this.use12Hour) {
            if (isPM) {
                h -= 12
            }
            if (h === 0) {
                h = 12
            }
        }
        const pad = (n:number) => n.toString(10).padStart(2, "0")
        const month = pad(time.getMonth() + 1)
        const day = pad(time.getDate())
        const m = pad(time.getMinutes())
        const s = pad(time.getSeconds())
        const ms = time.getMilliseconds().toString(10).padStart(3, "0")
        return `${this.use12Hour ? (isPM ? "P" : "A") : ""}${pad(h)}:${m}:${s}.${ms}`
    }
    /**
     * Mix A and B, P P A P
     * @param color1 C2lor 1
     * @param color2 Color 2
     */
    protected mixColor(color1:[string, number?], color2:[string, number?]) {
        const decodeColor = (str:string, start:number, ln:number) => {
            return Number.parseInt(str.substr(start, ln), 16)
        }
        const decodeColors = (str:string, alpha = 1) => {
            return {
                r: decodeColor(str, 1, 2),
                g: decodeColor(str, 3, 2),
                b: decodeColor(str, 5, 2),
                a: alpha,
            }
        }
        const encodeColors = (rgba:{ r:number, g:number, b:number, a:number }) => {
            const encodeC = (n:number) => n.toString(16).padStart(2, "0")
            const encodeCs = (...n:number[]) => n.map((v) => encodeC(v)).join("")
            return `#${encodeCs(rgba.r, rgba.g, rgba.b)}`
        }
        if (color1.length < 2) {
            color1[1] = 1
        }
        if (color2.length < 2) {
            color2[1] = 1
        }
        return encodeColors(normal(
            decodeColors(color1[0], color1[1]), decodeColors(color2[0], color2[1]),
        ))
    }
    /**
     * Print Content with split & color & beauty
     *
     * This can't be optimized.
     * @param header
     * @param content
     * @param options
     */
    protected printSimple(header:string, content:string, options:{
        tagName:string, colorTheme:string, fontColor:string,
        level:LogLv, backColor?:string}) {
        // check log level
        if (this.logLevel > options.level) {
            return ""
        }
        // define external properties
        let theme1 = this.defaultTheme.hex(options.fontColor)
        let theme2 = chalk.bgHex(
            this.mixColor([this.generalColors.back], ["#7f7f7f", 0.2]))
            .hex(options.fontColor)
        if (options.backColor != null) {
            theme1 = theme1.bgHex(options.backColor)
            theme2 = theme2.bgHex(this.mixColor([options.backColor], ["#7f7f7f", 0.2]))
        }
        const theme = theme1.hex(options.colorTheme) /*.hex(options.fontColor) */
        const callerFrom = this.caller(2)
        let caller = ""
        let encBottom = ""
        if (callerFrom != null && useOrigin()) {
            caller = this.encodeCaller(callerFrom)
            encBottom = this.infoTheme(this.getFooter(caller))
        }
        const encHeader = theme(
            `${this.getHeader(header, theme.inverse)} `,
        ) + theme.inverse(
            ` ${options.tagName.substr(0, 1)} `,
        ) + theme1(" ")
        const middleStyle = theme.inverse
        const encMiddle = `${this.getMiddle(middleStyle, options.tagName)}${theme(" ")}`
        // split to fit
        const splitted = content.split("\n")
        let largeDesign = false
        if (splitted.length >= 3) {
            const lengthes = splitted.map((v) => v.length)
            let i = 0
            for (const ln of lengthes) {
                i += ln
            }
            splitted.splice(0, 0, chalk.italic(`${splitted.length}L, ${i}C${
                (caller.length >= 1) ? (", " + this.getFooter(caller).trimRight()) : ""
            }`))
            largeDesign = true
        }
        for (let i = 0; i < splitted.length; i += 1) {
            if (splitted[i] === "") {
                splitted[i] = " "
            }
        }
        const lines:Array<{content:string, lineNo:number}> = []
        let maxLn0 = this.width - consoleLn(encHeader) - 1
        let maxLnA = this.width - consoleLn(encMiddle) - 1
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
                    textInfo.lastStyle = ansiParser.getAtIndex(
                        text, stripAnsi(text), stripAnsi(text).length - 1).style
                }
                lastStyle = textInfo.lastStyle
                lines.push({
                    content: text,
                    lineNo: i + 1,
                })
                k += textInfo.original.length
                maxLn = maxLnA
            }
            if (lines.length >= 1) {
                lastStyle = null
                lines[lines.length - 1] = {
                    content: lines[lines.length - 1].content + `\x1B[0m`,
                    lineNo: i + 1,
                }
            }
        }
        // print
        // padding to end. (add 1 length to pad End.)
        maxLn0 += 1
        maxLnA += 1
        // tslint:disable-next-line
        let out = new String()
        let lastLine = -1
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i].content
            const lineNo = lines[i].lineNo + (largeDesign ? -1 : 0)
            const lineTheme = lines[i].lineNo % 2 === 1 ? theme1 : theme2
            let thisLine = ""
            if (i === 0) {
                thisLine += encHeader
                thisLine += lineTheme(line)
                if (i < lines.length - 1) {
                    thisLine += lineTheme("".padEnd(maxLn0 - consoleLn(line)))
                }
            } else {
                thisLine += `${this.getMiddle(middleStyle,
                    (lastLine !== lineNo ? lineNo.toString() : "").padStart(this.middleSize))
                    }${lineTheme(" ")}`
                if (i < lines.length - 1) {
                    thisLine += lineTheme(line) +
                        lineTheme("".padEnd(maxLnA - consoleLn(line)))
                } else {
                    thisLine += lineTheme(line)
                }
            }
            if (i === lines.length - 1) {
                const left = this.width - consoleLn(stripAnsi(thisLine))
                if (largeDesign) {
                    thisLine += lineTheme("".padStart(this.width - consoleLn(thisLine)))
                } else if (left >= consoleLn(encBottom)) {
                    thisLine += lineTheme("".padStart(left - consoleLn(encBottom)))
                    thisLine += encBottom
                } else {
                    thisLine += lineTheme("".padStart(this.width - consoleLn(thisLine)))
                    thisLine += "\n"
                    thisLine += lineTheme("".padStart(this.width - consoleLn(encBottom))) + encBottom
                }
            } else {
                thisLine += "\n"
            }
            lastLine = lineNo
            out += thisLine
        }
        // out += "\n"
        return this.write(out.toString())
    }
    /**
     * Get Header of logger
     *
     * [Timestamp] [Header] [typeInfo]
     * @param header To print header
     * @param typeStr To print type
     */
    protected getHeader(header:string, timeTheme:Chalk) {
        const headerCut = substrMono(header, 0, this.headerSize)
        const padLn = headerCut.content.length + this.headerSize - consoleLn(headerCut.original)
        return `${
            timeTheme(" " + this.timestamp + " ")} ${headerCut.content.padStart(padLn)}`
    }
    protected getMiddle(style:Chalk, typeStr:string) {
        const cutted = substrMono(typeStr, 0, this.headerSize)
        return style(` ${cutted.content.padStart(
            cutted.content.length + this.middleSize - cutted.original.length)} `)
    }
    protected getFooter(encodedCaller:string) {
        return ` ${encodedCaller} `
    }
    protected write(str:string) {
        console.log(str)
        /*
        return new Promise<string>((res, rej) => {
            process.stdout.write(str, () => res(stripAnsi(str)))
        })
        */
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
function useOrigin() {
    if (process.env.CLOG_ORIGIN === undefined) {
        return false
    }
    return process.env.CLOG_ORIGIN === "true"
}
function toStringStack(stack:StackTrace.StackFrame) {
    return `${stack.getFunctionName()} (${stack.getFileName()}:${stack.getLineNumber()}:${stack.getColumnNumber()})`
}

const chocolog = new ChocoLog("ChocoRoyce")

export default chocolog

type EnumPair<T extends object> = {
    [K in keyof T]: T[K]
}

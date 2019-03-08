import ansiParser, { removeAnsi } from "ansi-parser"
import chalk, { Chalk } from "chalk"
import Color from "color"
import { normal } from "color-blend"
import emphasize, { HlLanguage, Sheet } from "emphasize"
import { write } from "fs"
import fs from "fs-extra"
import fetch from "node-fetch"
import path from "path"
import StackTrace from "stack-trace"
import stringify from "stringify-object"
import uuidRand from "uuid/v4"
import wcwidth from "wcwidth"
import { asReadonly, DeepReadonly } from "../types/deepreadonly"
import { Serializable, SerializableGeneric, Serializify } from "../types/serialize"
import { hueColors, TypeColors } from "./colordefine"
import { HlTheme } from "./hlthemes"
import { LogLv, LogLvStatic } from "./loglv"
import { ansiExp, consoleLn, makeBlank, padEndMono, stripAnsi, substrMono } from "./monoutil"
import { decodeNo, encodeNo, forceIndent, forceIndenter, indenter, valNameIndenter } from "./tostr"
import TsMap from "./tsmap"
import { vs2015CSS } from "./vs2015css"
if (useOrigin()) {
    // module to extends stacktrace
    // this is MUST require for duplicate stacktrace tracking
    require("trace")
    require("clarify")
}

const jsPath = __filename

export class ChocoLog {
    /**
     * Default theme
     *
     * Used in text content
     */
    protected get defaultTheme() {
        return chalk.bgHex(this.generalColors.back).hex(this.generalColors.text)
    }

    protected get width() {
        return process.stdout.columns
    }
    protected get headerSize() {
        return Math.min(this.minHeaderSize, Math.floor(this.width / 4))
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
    /*
    =====================================================
    = Theme Part
    =====================================================
    */
    /**
     * Current log level
     */
    protected logLevel:LogLv
    /**
     * Code theme store
     */
    protected codeStyle:Sheet
    /**
     * General colors (all used to type)
     */
    protected generalColors = {
        back: "#222222",
        backSub: "#333333",
        backInfo: "#444444",
        text: "#eeeeee",
    }
    protected typedColors:TypeColors
    protected middleSize = 3
    protected subpadSize = 1

    protected cwd = process.cwd()
    protected sourceMap:Map<string, TsMap> = new Map()
    // protected headerChalk = chalk.
    public constructor(name:string) {
        this.name = name
        this.logLevel = ChocoLog.defaultLevel
        this.setCssTheme(vs2015CSS)
    }
    /*
    =====================================================
    = Define default methods
    = Due to callback detector, we should copy-paste code.
    =====================================================
    */
    /**
     * Prints *debug* log. (Loglevel 2)
     * @param title Title of logger. If none, this is used to content
     * @param desc Contents to print
     */
    public d(title:unknown, ...desc:Array<unknown>) {
        const [strTitle, strDesc] = this.fallbackParam(title, desc)
        return this.printSimple(strTitle, strDesc, {
            tagName: "D",
            colorTheme: this.typedColors.debug,
            fontColor: this.generalColors.text,
            level: this.levels.DEBUG,
        })
    }
    /**
     * Prints *verbose* log. (Loglevel 1)
     * @param title Title of logger. If none, this is used to content
     * @param desc Contents to print
     */
    public v(title:unknown, ...desc:Array<unknown>) {
        const [strTitle, strDesc] = this.fallbackParam(title, desc)
        return this.printSimple(strTitle, strDesc, {
            tagName: "V",
            colorTheme: this.generalColors.text,
            fontColor: this.generalColors.text,
            level: this.levels.VERBOSE,
        })
    }
    /**
     * Prints *info* log. (Loglevel 3)
     * @param title Title of logger. If none, this is used to content
     * @param desc Contents to print
     */
    public i(title:unknown, ...desc:Array<unknown>) {
        const [strTitle, strDesc] = this.fallbackParam(title, desc)
        return this.printSimple(strTitle, strDesc, {
            tagName: "I",
            colorTheme: this.typedColors.info,
            fontColor: this.generalColors.text,
            level: this.levels.INFO,
        })
    }
    /**
     * Prints *warn* log. (Loglevel 4)
     * @param title Title of logger. If none, this is used to content
     * @param desc Contents to print
     */
    public w(title:unknown, ...desc:Array<unknown>) {
        const [strTitle, strDesc] = this.fallbackParam(title, desc)
        return this.printSimple(strTitle, strDesc, {
            tagName: "W",
            colorTheme: this.typedColors.warn,
            fontColor: this.generalColors.text,
            level: this.levels.WARN,
        })
    }
    /**
     * Prints *error* log. (Loglevel 5)
     * @param title Title of logger. If none, this is used to content
     * @param desc Contents to print
     */
    public e(title:unknown, ...desc:Array<unknown>):null {
        const [strTitle, strDesc] = this.fallbackParam(title, desc)
        this.printSimple(strTitle, strDesc, {
            tagName: "E",
            colorTheme: this.typedColors.error,
            fontColor: this.typedColors.error,
            level: this.levels.ERROR,
        })
        return null
    }
    /**
     * ☠ (Loglevel **6**)
     * @param title Title of logger. If none, this is used to content
     * @param desc Contents to print
     */
    public wtf(title:unknown, ...desc:Array<unknown>) {
        const params = this.fallbackParam(title, desc)
        return this.printSimple(params[0], params[1], {
            tagName: "F",
            colorTheme: this.typedColors.assert,
            fontColor: this.typedColors.assert,
            level: this.levels.ASSERT,
        })
    }
    /**
     * Log programming code with formatter
     *
     * used `highlight.js` wrapper `emphasize`
     * @param codeContent Code string to print (css, js, etc...)
     * @param title Title of log, not need at normal.
     * @param lang The language of the code. If non-specic, Library will auto detect
     */
    public code(codeContent:string, title?:string | number | boolean, lang?:HlLanguage) {
        let _title:string
        if (title == null) {
            _title = "Code"
        } else {
            _title = this.toStr(title)
        }
        const desc = this.beautyCode(codeContent, lang)
        return this.printSimple(_title, desc, {
            tagName: "C",
            colorTheme: this.generalColors.text,
            fontColor: this.generalColors.text,
            level: this.levels.VERBOSE,
        })
    }
    /**
     * Set `highlight.js` theme to console
     *
     * Almost check [highlight.js github](https://github.com/highlightjs/highlight.js/tree/master/src/styles)
     *
     * Scss not supported.
     * @param css css text
     */
    public setCssTheme(css:string) {
        // get hljs global css
        const queryHljs = getFirst(css.match(/\.hljs\s*{[\S\s]+?}/))
        if (queryHljs == null) {
            // wtf
            this.wtf("setCssTheme", "QueryHljs being null!")
            this.code(css, "CSSInfo", "css")
            return this.codeStyle
        }
        // background color search
        const queryBack = getFirst(queryHljs.match(/^\s*background:.+?;/im))
        let codeBackground:string
        let codeTextColor:string
        if (queryBack != null) {
            try {
                codeBackground = cssToColor(queryBack.trim())
            } catch (err) {
                this.w("setCodeTheme", "Color_bg parse Failed\n", err)
            }
        }
        // foreground color search
        const queryFore = getFirst(queryHljs.match(/^\s*color:.+?;/im))
        if (queryFore != null) {
            try {
                codeTextColor = cssToColor(queryFore.trim())
            } catch (err) {
                this.w("setCodeTheme", "Color_text parse Failed.\n", err)
            }
        }
        this.setBgTheme(codeBackground == null ? this.generalColors.back : codeBackground, codeTextColor)
        // child style search
        const queries = css.match(/\.hljs-[a-zA-Z\-_,.\s]+?{[\S\s]+?}/g)
        const styles:{[key in string]:Chalk} = {}
        for (const query of queries) {
            // 1. color
            let color:string = null
            try {
                color = cssToColor(getFirst(query.match(/color:.+;/)))
            } catch (err) {
                this.w("setCodeTheme", "ColorText parse failed.\n", err)
            }
            let colorBack:string
            try {
                colorBack = cssToColor(getFirst(query.match(/background-color:.+;/)))
            } catch (err) {
                this.w("setCodeTheme", "ColorBack parse failed.\n", err)
            }
            const bold = query.match(/font-weight:\s*bold;/) != null
            const italic = query.match(/font-style:\s*italic;/) != null
            const underline = query.match(/text-decoration:\s*underline;/) != null
            const headers = query.match(/.hljs-.+/ig)
            if (headers == null) {
                continue
            }
            for (const header of headers) {
                let head = header.replace(/^\.hljs-/i, "").replace(/,\s*/i, "").replace("{", "").trim()
                if (head === "constructor") {
                    head = "_" + head
                }
                let style:Chalk = styles[head]
                if (style === undefined) {
                    style = chalk
                }
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
                styles[head] = style
            }
        }
        if (styles["_constructor"] != null) {
            styles["constructor"] = styles["_constructor"]
        }
        this.codeStyle = styles
        return styles
    }
    /**
     * Set background & text color
     *
     * Auto modify type colors.
     * @param background Background of terminal
     * @param textColor The default text color of terminal
     */
    public setBgTheme(background:string, textColor?:string) {
        const bgColor = Color(background).hsv()
        if (textColor === undefined) {
            if (bgColor.isDark()) {
                textColor = "#dddddd"
            } else {
                textColor = "#111111"
            }
        }
        const bgValue = bgColor.value()
        const toHex = (cl:Color) => {
            return cl.hex().replace("0x", "#")
        }
        const genColor = (hue:number) => {
            const sat = Math.round(25 + (bgValue) * 0.55)
            const val = Math.round(55 + (100 - bgValue) * 0.45)
            return toHex(Color({h:hue, s: sat, v: val}))
        }
        const obj = {} as TypeColors
        for (const [k,v] of Object.entries(hueColors)) {
            obj[k] = genColor(v)
        }
        this.typedColors = obj
        this.generalColors.back = background
        this.generalColors.text = textColor
        if (bgColor.isDark()) {
            const fn = (n:number) => {
                if (bgColor.value() <= 0.05) {
                    const hex = (Math.floor(n * 80)).toString(16).toUpperCase()
                    return Color(`#${hex}${hex}${hex}`)
                }
                return bgColor.lighten(n)
            }
            this.generalColors.backSub = toHex(fn(0.2))
            this.generalColors.backInfo = toHex(fn(0.3))
        } else {
            const fn = (n:number) => {
                return bgColor.darken(n)
            }
            this.generalColors.backSub = toHex(fn(0.1))
            this.generalColors.backInfo = toHex(fn(0.3))
        }
    }
    /**
     * Apply Highlight.js style from github
     *
     * https://github.com/highlightjs/highlight.js
     * @param type Highlight.js style
     */
    public async setStyleGithub(type:HlTheme) {
        const url = `https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/${type}.css`
        const css = await fetch(url).then((v) => v.text())
        this.setCssTheme(css)
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
    /**
     * Clones this Log class and returns it
     * @param name New logger's name
     */
    public getLogger(name:string):ChocoLog {
        const cloned = new ChocoLog(name)
        // level
        cloned.setLevel(ChocoLog.defaultLevel)
        // code style
        cloned.codeStyle = this.codeStyle
        // color theme
        cloned.generalColors = {...this.generalColors}
        cloned.typedColors = {...this.typedColors}
        // etc conf
        cloned.use12Hour = this.use12Hour
        cloned.minHeaderSize = this.minHeaderSize
        return cloned
    }
    /**
     * Let's trace error beauty
     * @param err Error
     */
    protected errorToString(err:Error) {
        const rawStacks = this.filterStack(StackTrace.parse(err))
        const stackes:string[] = []
        for (const stack of rawStacks) {
            stackes.push(this.encodeCaller(this.decodeStack(stack)))
        }
        return `[${err.name}] ${err.message}\n${stackes.map((v) => `  at ${v}`).join("\n")}`
    }
    /**
     * Decode LogLv to number
     * @param level LogLv
     */
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
     * Something type to string (Maybe recursive)
     * @param obj any object or number or etc..
     */
    protected toStr(obj:unknown, beauty = true):string {
        const cubeCache:string[] = []
        const toJSONOpt = {
            indent: indenter,
            singleQuotes: false,
            inlineCharacterLimit: 30,
            transform: (o:object, prop:string | number | symbol, value:string) => {
                if (o[prop] instanceof Date) {
                    return (o[prop] as Date).toString()
                } else if (o[prop] instanceof Error) {
                    const str = `\u{1F4A5} ${this.errorToString(o[prop])}`
                    value = forceIndent(str)
                    value = chalk.hex(this.typedColors.error)(value)
                } else if (o[prop] instanceof Map) {
                    const toObj = this.mapToObject<unknown>(o[prop])
                    value = forceIndent(stringify(toObj, toJSONOpt))
                } else if (typeof o[prop] === "function") {
                    // return value
                    value = this.beautyCode(value)
                } else {
                    // return value
                }
                const ansies = value.match(ansiExp)
                if (ansies != null) {
                    cubeCache.push(value)
                    value = `\u{FFF5}_A${encodeNo(cubeCache.length - 1)}_`
                }
                return value // .replace(new RegExp("\x1B\\[", "ig"), "\u{FFF5}_C>")
            },
        }
        if (obj === null) {
            if (beauty) {
                // return chalk.italic("null")
                return "null"
            } else {
                return "null"
            }
        }
        if (obj === undefined) {
            if (beauty) {
                // return chalk.italic("undefined")
                return "undefined"
            } else {
                return "undefined"
            }
        }
        switch (typeof obj) {
            case "string":
                return obj
            case "boolean":
            case "number":
            case "symbol":
            case "bigint":
                return obj.toString()
        }
        if (obj instanceof Buffer) {
            return obj.toString()
        }
        if (obj instanceof Error) {
            return this.errorToString(obj)
        }
        if (obj instanceof Date) {
            return obj.toString()
        }
        if (obj instanceof Map || typeof obj === "object" || typeof obj === "function") {
            if (obj instanceof Map) {
                obj = this.mapToObject(obj)
            }
            let json = stringify(obj, toJSONOpt)
            let lastIntentNum = 0
            let lastValNameNum = 0
            // 1. beauty
            if (beauty) {
                json = this.beautyJSON(json)
            }
            // 2. decode
            const ansiRep = json.match(new RegExp(`\u{FFF5}_A.+?_`, "g"))
            if (ansiRep != null) {
                for (const ansiR of ansiRep) {
                    const str = ansiR.match(/_A.+?_/i)[0]
                    const index = decodeNo(str.substring(2, str.length - 1))
                    json = json.replace(ansiR, cubeCache[index])
                }
            }
            // 3. tab
            if (json.indexOf(forceIndenter) >= 0) {
                const lines = json.split("\n")
                for (let i = 0; i < lines.length; i += 1) {
                    let line = lines[i]
                    const nonStyleLine = stripAnsi(line)
                    let intentNum = 0
                    if (!nonStyleLine.startsWith(indenter) && !nonStyleLine.startsWith(forceIndenter)) {
                        continue
                    }
                    while (line.startsWith(indenter)) {
                        line = line.replace(indenter, "")
                        intentNum += 1
                    }
                    const valName = line.match(/^.*?:\s*/i)
                    let valNameLn = -1
                    if (valName != null) {
                        valNameLn = consoleLn(valName[0])
                    }
                    const isForcedIntenter = nonStyleLine.startsWith(forceIndenter)
                    if (isForcedIntenter) {
                        let madeIntent = ""
                        for (let k = 0; k < lastIntentNum; k += 1) {
                            madeIntent += indenter
                        }
                        lines[i] = line
                            .replace(forceIndenter, madeIntent)
                            .replace(valNameIndenter, makeBlank(lastValNameNum))
                    }
                    if (valNameLn >= 0 && !isForcedIntenter) {
                        lastValNameNum = valNameLn
                    }
                    if (intentNum > 0 && !isForcedIntenter) {
                        lastIntentNum = intentNum
                    }
                }
                json = lines.join("\n")
            }
            return json
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
                const _str = this.toStr(str)
                /*
                if (_str.indexOf("\n") >= 0 && !_str.startsWith("\n")) {
                    _str = "\n" + _str
                }
                */
                descStr += _str
            }
        }
        if (!ansiExp.test(descStr)) {
            descStr = this.beautyJSON(descStr)
        }
        let _title = title as string
        if (_title.indexOf("\n") >= 0) {
            _title = _title.replace(/\s*\n\s*/ig, "")
        }
        return [_title, descStr] as [string, string]
    }
    protected mapToObject<V>(map:Map<unknown, V>) {
        const KV = map.entries()
        const obj:{ [K in string]: V } = {}
        for (const [key, value] of KV) {
            obj[this.toStr(key, false)] = value
        }
        return obj
    }
    protected encodeCaller(called:Called) {
        return `${called.funcName} (${called.fileName}:${called.line}:${called.column})`
    }
    protected caller() {
        const stackes = this.filterStack(StackTrace.get())
        for (const stack of stackes) {
            const fname = stack.getFileName()
            if (fname !== jsPath) {
                return this.decodeStack(stack)
            }
        }
        return this.decodeStack(stackes[stackes.length - 1])
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
                sourcepath = path.relative(this.cwd, sourcepath)
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
    protected beautyCode(code:string, type?:HlLanguage) {
        let val:string
        if (type !== undefined) {
            val = emphasize.highlight(type, code, this.codeStyle).value
        } else {
            val = emphasize.highlightAuto(code, this.codeStyle).value
        }
        return val
    }
    protected beautyJSON(json:string) {
        return emphasize.highlight("json", json, this.codeStyle).value
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
        level:LogLv}) {
        // check log level
        if (this.logLevel > options.level) {
            return ""
        }
        // define external properties
        const theme1 = this.defaultTheme.hex(options.fontColor)
        const theme2 = chalk.bgHex(this.generalColors.backSub).hex(options.fontColor)
        const theme = theme1.hex(options.colorTheme) /*.hex(options.fontColor) */
        const callerFrom = this.caller()
        let caller = ""
        let encBottom = ""
        if (callerFrom != null && useOrigin()) {
            caller = this.encodeCaller(callerFrom)
            encBottom = chalk.bgHex(this.generalColors.backInfo)
                .hex(options.colorTheme).italic(this.getFooter(caller))
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
            const pureLineLn = stripAnsi(line).length
            let maxLn = i === 0 ? maxLn0 : maxLnA
            let k = 0
            while (k < pureLineLn) {
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
        const calcLnWithTab = (str:string, prefix:string) => {
            return consoleLn(prefix + str) - consoleLn(prefix)
        }
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i].content
            const lineNo = lines[i].lineNo + (largeDesign ? -1 : 0)
            const lineTheme = lines[i].lineNo % 2 === 1 ? theme1 : theme2
            let thisLine = ""
            if (i === 0) {
                thisLine += encHeader
                thisLine += lineTheme(line)
                if (i < lines.length - 1) {
                    thisLine += lineTheme(makeBlank(maxLn0 - calcLnWithTab(line, encHeader)))
                }
            } else {
                let indexVo = ""
                if (lastLine !== lineNo) {
                    indexVo = lineNo.toString()
                }
                thisLine += `${this.getMiddle(middleStyle,
                    makeBlank(this.middleSize - consoleLn(indexVo)) + indexVo)
                    }${lineTheme(" ")}`
                if (i < lines.length - 1) {
                    thisLine += lineTheme(line) +
                        lineTheme(makeBlank(maxLnA - calcLnWithTab(line, thisLine)))
                } else {
                    thisLine += lineTheme(line)
                }
            }
            if (i === lines.length - 1) {
                const left = this.width - consoleLn(stripAnsi(thisLine))
                if (largeDesign) {
                    thisLine += lineTheme(makeBlank(this.width - consoleLn(thisLine)))
                } else if (left >= consoleLn(encBottom)) {
                    thisLine += lineTheme(makeBlank(left - consoleLn(encBottom)))
                    thisLine += encBottom
                } else {
                    thisLine += lineTheme(makeBlank(this.width - consoleLn(thisLine)))
                    thisLine += "\n"
                    thisLine += lineTheme(makeBlank(this.width - consoleLn(encBottom))) + encBottom
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
        return style(`${cutted.content.padStart(
            cutted.content.length + this.middleSize - cutted.original.length + 1)} `)
    }
    protected getFooter(encodedCaller:string) {
        return ` ${encodedCaller} `
    }

    protected write(str:string) {
        console.log(str)
        return str
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
    try {
        Color(filter)
    } catch (err) {
        const org = filter
        filter = getFirst(filter.match(/#[A-Fa-f0-9]{1,6}/ig))
        if (filter == null) {
            throw new Error("Unknown color " + org)
        }
    }
    filter = filter.replace(/url\(.+?\)/ig, "").trim()
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

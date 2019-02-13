"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ansi_parser_1 = __importDefault(require("ansi-parser"));
const ansi_regex_1 = __importDefault(require("ansi-regex"));
const chalk_1 = __importDefault(require("chalk"));
const color_1 = __importDefault(require("color"));
const emphasize_1 = __importDefault(require("emphasize"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const stack_trace_1 = __importDefault(require("stack-trace"));
const stringify_object_1 = __importDefault(require("stringify-object"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const monoutil_1 = require("./monoutil");
const tsmap_1 = __importDefault(require("./tsmap"));
if (isDebug()) {
    // module to extends stacktrace
    // this is MUST require for duplicate stacktrace tracking
    require("trace");
    require("clarify");
}
const defaultCodeCSS = "https://raw.githubusercontent.com/highlightjs/highlight.js/master/src/styles/vs2015.css";
class ChocoLog {
    constructor() {
        this.name = "chocolog";
        this.stack = 0;
        this.codeBackground = "#222222";
        this.codeTextColor = "#ffffff";
        this.codeStyle = null;
        this.brightDark = "#333333";
        this.defaultTheme = chalk_1.default.bgHex("#222222").hex("#eeeeee");
        this.defaultTheme2 = chalk_1.default.bgHex("#292929").hex("#eeeeee");
        this.infoTheme = chalk_1.default.bgHex("#fce5e5").hex(this.brightDark);
        this.lineTheme = chalk_1.default.bgHex("#e2e2e2").hex("#111111");
        this.middleSize = 3;
        this.subpadSize = 1;
        this.cwd = process.cwd();
        this.sourceMap = new Map();
    }
    get width() {
        return process.stdout.columns;
    }
    get headerSize() {
        return Math.min(24, Math.floor(this.width / 4));
    }
    // protected headerChalk = chalk.
    /*
    =====================================================
    = Define default methods
    = Due to callback detector, we should copy-paste code.
    =====================================================
    */
    /**
     * Debug log
     */
    async d(_title, _desc) {
        const [title, desc] = await this.fallbackParam(_title, _desc);
        return this.printSimple(title, desc, {
            tagName: "D",
            colorTheme: chalk_1.default.bgHex(this.brightDark).hex("#a6db92"),
            fontColor: "#dddddd",
        });
        // "#a6db92"
    }
    /**
     * Verbose log
     */
    async v(_title, _desc) {
        const [title, desc] = await this.fallbackParam(_title, _desc);
        return this.printSimple(title, desc, {
            tagName: "V",
            colorTheme: chalk_1.default.bgHex(this.brightDark).hex("#ffd7ff"),
            fontColor: "#dddddd",
        });
    }
    /**
     * Info log
     */
    async i(_title, _desc) {
        const [title, desc] = await this.fallbackParam(_title, _desc);
        return this.printSimple(title, desc, {
            tagName: "I",
            colorTheme: chalk_1.default.bgHex(this.brightDark).hex("#afd7ff"),
            fontColor: "#dddddd",
        });
    }
    /**
     * Warning log
     */
    async w(_title, _desc) {
        const [title, desc] = await this.fallbackParam(_title, _desc);
        return this.printSimple(title, desc, {
            tagName: "W",
            colorTheme: chalk_1.default.bgHex(this.brightDark).hex("#fffacd"),
            fontColor: "#dddddd",
        });
    }
    /**
     * Error log
     */
    async e(_title, _desc) {
        const [title, desc] = await this.fallbackParam(_title, _desc);
        return this.printSimple(title, desc, {
            tagName: "E",
            colorTheme: chalk_1.default.bgHex(this.brightDark).hex("#ff715b"),
            fontColor: "#c64337",
        }).then(() => null);
    }
    /**
     * What the f***
     */
    async wtf(_title, _desc) {
        let [title, desc] = await this.fallbackParam(_title, _desc);
        desc = chalk_1.default.hex("#ffcbc6")(desc);
        return this.printSimple(title, desc, {
            tagName: "F",
            colorTheme: chalk_1.default.bgHex("#660900").hex("#ff0000"),
            fontColor: "#ffcbc6",
        });
    }
    /**
     * Log programming code with auto formatter
     *
     * used `highlight.js` wrapper `emphasize`
     * @param _code Code string to print (css, js, etc...)
     * @param _title Title of log, not need at normal.
     */
    async code(_code, _title) {
        if (_title == null) {
            _title = "Code";
        }
        else {
            _title = await this.toStr(_title);
        }
        const desc = emphasize_1.default.highlightAuto(_code, this.codeStyle).value;
        return this.printSimple(await _title, desc, {
            tagName: "C",
            colorTheme: chalk_1.default.bgHex(this.codeBackground).hex(this.codeTextColor),
            fontColor: this.codeTextColor,
        });
    }
    /*
    =====================================================
    = Theme Part
    =====================================================
    */
    async setDefaultTheme() {
        return this.setCodeTheme(defaultCodeCSS);
    }
    /**
     * Set `highlight.js` theme to Emphasize's styleSheet
     *
     * And maybe apply this log.
     *
     * @param css URL or raw css content
     */
    async setCodeTheme(css) {
        if (css.startsWith("http")) {
            css = await node_fetch_1.default(css).then((v) => v.text());
        }
        // background color search
        const queryBack = getFirst(css.match(/\.hljs\s*{[\S\s]+background:.+;\s*?}/));
        if (queryBack != null) {
            let filter = queryBack.match(/background:.+?;/)[0];
            filter = cssToColor(filter);
            this.codeBackground = filter;
        }
        // foreground color search
        const queryFore = getFirst(css.match(/\.hljs\s*{[\S\s]+color:.+;\s*?}/));
        if (queryFore != null) {
            let filter = queryFore.match(/color:.+?;/)[0];
            filter = cssToColor(filter);
            this.codeTextColor = filter;
        }
        // child style search
        const queries = css.match(/\.hljs-[a-zA-Z\-_,.\s]+?{[\S\s]+?}/g);
        const styles = {};
        for (const query of queries) {
            // 1. color
            const color = cssToColor(getFirst(query.match(/color:.+;/)));
            const colorBack = cssToColor(getFirst(query.match(/background-color:.+;/)));
            const bold = query.match(/font-weight:\s*bold;/) != null;
            const italic = query.match(/font-style:\s*italic;/) != null;
            const underline = query.match(/text-decoration:\s*underline;/) != null;
            const headers = query.match(/.hljs-.+/ig);
            if (headers == null) {
                continue;
            }
            let style = chalk_1.default;
            if (color != null) {
                style = style.hex(color);
            }
            if (colorBack != null) {
                style = style.bgHex(colorBack);
            }
            if (bold) {
                style = style.bold;
            }
            if (italic) {
                style = style.italic;
            }
            if (underline) {
                style = style.underline;
            }
            for (const header of headers) {
                styles[header.replace(".hljs-", "").replace(",", "")] = style;
            }
        }
        this.codeStyle = styles;
        return styles;
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
    async toStr(obj) {
        if (obj instanceof Map) {
            const out = {};
            for (const [key, value] of obj.entries()) {
                out[key] = value;
            }
            return this.beautyJSON(stringify_object_1.default(out, {
                indent: "  ",
                singleQuotes: false,
            }));
        }
        if (obj instanceof Error) {
            const rawStacks = this.filterStack(stack_trace_1.default.parse(obj));
            const stackes = [];
            for (const stack of rawStacks) {
                stackes.push(this.encodeCaller(await this.decodeStack(stack)));
            }
            return `${obj.name} : ${obj.message}\n${stackes.map((v) => `  at ${v}`).join("\n")}`;
        }
        switch (typeof obj) {
            case "string":
                return obj;
            case "boolean":
            case "number":
            case "bigint":
                return obj.toString();
            case "function":
                return `[Function ${obj.name}]`;
            case "undefined":
                return `[undefined]`;
            case "object": {
                return stringify_object_1.default(obj, {
                    indent: "  ",
                    singleQuotes: false,
                });
            }
            default:
                return "";
        }
    }
    async fallbackParam(title, desc) {
        if (desc == null) {
            desc = await this.toStr(title);
            title = ` `;
        }
        else {
            title = await this.toStr(title);
            desc = await this.toStr(desc);
        }
        if (!ansi_regex_1.default().test(desc)) {
            desc = this.beautyJSON(desc);
        }
        return [title, desc];
    }
    encodeCaller(called) {
        return `${called.funcName} (${called.fileName}:${called.line}:${called.column})`;
    }
    async caller(deeper) {
        const stackes = this.filterStack(stack_trace_1.default.get());
        const query = stackes[1 + deeper];
        return this.decodeStack(query);
    }
    filterStack(stacktrace) {
        return stacktrace.filter((v, pos) => {
            return stacktrace.findIndex((_v) => _v.getFunctionName() === v.getFunctionName() && _v.getFileName() === v.getFileName())
                === pos;
        });
    }
    async decodeStack(query) {
        // const lastEl = <T>(arr:T[]) => arr[arr.length - 1]
        let sourcepath = query.getFileName();
        // const lastInfo = lastEl(sourcepath.split(/[\/\\]/ig))
        let sourceLine = query.getLineNumber();
        let sourceColumn = query.getColumnNumber();
        const functionName = query.getFunctionName();
        // functionName = functionName.substring(0, functionName.length - 1).trim()
        // functionName = functionName.substring(3, functionName.length)
        // sourcepath = sourcepath.substring(0, sourcepath.indexOf(":"))
        if (!this.sourceMap.has(sourcepath)) {
            const mapPath = `${sourcepath}.map`;
            if (await fs_extra_1.default.pathExists(mapPath)) {
                this.sourceMap.set(sourcepath, await tsmap_1.default.from(mapPath));
            }
            else {
                this.sourceMap.set(sourcepath, null);
            }
        }
        if (this.sourceMap.get(sourcepath) != null) {
            const sourceMap = this.sourceMap.get(sourcepath);
            const info = sourceMap.decodePoint(sourceLine, sourceColumn);
            if (info != null) {
                sourcepath = path_1.default.relative(this.cwd, sourceMap.getFilePath());
                sourceLine = info.tsRow;
                sourceColumn = info.tsColumn;
            }
            else {
                console.error(new Error("Info is null!"));
            }
        }
        else {
            sourcepath = path_1.default.relative(this.cwd, sourcepath);
        }
        if (!sourcepath.startsWith(".")) {
            sourcepath = `.${path_1.default.sep}${sourcepath}`;
        }
        return {
            fileName: sourcepath,
            funcName: functionName,
            line: sourceLine,
            column: sourceColumn,
        };
    }
    beautyCode(code) {
        return emphasize_1.default.highlightAuto(code, this.codeStyle).value;
    }
    beautyJSON(json) {
        return emphasize_1.default.highlight("json", json, this.codeStyle).value;
    }
    get timestamp() {
        const time = new Date(Date.now());
        let h = time.getHours();
        const isPM = h >= 12;
        if (isPM) {
            h -= 12;
        }
        if (h === 0) {
            h = 12;
        }
        const pad = (n) => n.toString(10).padStart(2, "0");
        const m = time.getMinutes();
        const s = time.getSeconds();
        return `${isPM ? "P" : "A"}${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    /**
     * Print Content with split & color & beauty
     *
     * This can't be optimized.
     * @param header
     * @param content
     * @param options
     */
    async printSimple(header, content, options) {
        // define external properties
        const theme1 = this.defaultTheme.hex(options.fontColor);
        const theme2 = this.defaultTheme2.hex(options.fontColor);
        let theme = options.colorTheme; /*.hex(options.fontColor) */
        const caller = this.encodeCaller(await this.caller(2));
        const encHeader = theme(`${this.getHeader(header)} `) + options.colorTheme.inverse(` ${options.tagName.substr(0, 1)} `) + theme1(" ");
        const middleStyle = options.colorTheme.inverse;
        const encMiddle = `${this.getMiddle(middleStyle, options.tagName)}${theme(" ")}`;
        const encBottom = this.infoTheme(this.getFooter(caller));
        // split to fit
        const splitted = content.split("\n");
        let largeDesign = false;
        if (splitted.length >= 3) {
            const lengthes = splitted.map((v) => v.length);
            let i = 0;
            for (const ln of lengthes) {
                i += ln;
            }
            splitted.splice(0, 0, chalk_1.default.italic(`${splitted.length}L, ${i}C,${this.getFooter(caller).trimRight()}`));
            largeDesign = true;
        }
        for (let i = 0; i < splitted.length; i += 1) {
            if (splitted[i] === "") {
                splitted[i] = " ";
            }
        }
        const lines = [];
        let maxLn0 = this.width - monoutil_1.consoleLn(encHeader) - 1;
        let maxLnA = this.width - monoutil_1.consoleLn(encMiddle) - 1;
        let lastStyle = null;
        for (let i = 0; i < splitted.length; i += 1) {
            const line = splitted[i];
            const pureLineLn = strip_ansi_1.default(line);
            let maxLn = i === 0 ? maxLn0 : maxLnA;
            let k = 0;
            while (k < pureLineLn.length) {
                const textInfo = monoutil_1.substrMono(line, k, maxLn);
                let text = textInfo.content;
                if (lastStyle != null && lastStyle.length > 0) {
                    text = lastStyle + text;
                    textInfo.lastStyle = ansi_parser_1.default.getAtIndex(text, strip_ansi_1.default(text), strip_ansi_1.default(text).length - 1).style;
                }
                lastStyle = textInfo.lastStyle;
                lines.push({
                    content: text,
                    lineNo: i + 1,
                });
                k += textInfo.original.length;
                maxLn = maxLnA;
            }
            if (lines.length >= 1) {
                lastStyle = null;
                lines[lines.length - 1] = {
                    content: lines[lines.length - 1].content + `\x1B[0m`,
                    lineNo: i + 1,
                };
            }
        }
        // print
        // padding to end. (add 1 length to pad End.)
        maxLn0 += 1;
        maxLnA += 1;
        // tslint:disable-next-line
        let out = new String();
        let lastLine = -1;
        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i].content;
            const lineNo = lines[i].lineNo + (largeDesign ? -1 : 0);
            theme = lines[i].lineNo % 2 === 1 ? theme1 : theme2;
            let thisLine = "";
            if (i === 0) {
                thisLine += encHeader;
                thisLine += theme(line);
                if (i < lines.length - 1) {
                    thisLine += theme("".padEnd(maxLn0 - monoutil_1.consoleLn(line)));
                }
            }
            else {
                thisLine += `${this.getMiddle(middleStyle, (lastLine !== lineNo ? lineNo.toString() : "").padStart(this.middleSize))}${theme(" ")}`;
                if (i < lines.length - 1) {
                    thisLine += theme(line) +
                        theme("".padEnd(maxLnA - monoutil_1.consoleLn(line)));
                }
                else {
                    thisLine += theme(line);
                }
            }
            if (i === lines.length - 1) {
                const left = this.width - monoutil_1.consoleLn(strip_ansi_1.default(thisLine));
                if (largeDesign) {
                    thisLine += theme("".padStart(this.width - monoutil_1.consoleLn(thisLine)));
                }
                else if (left >= monoutil_1.consoleLn(encBottom)) {
                    thisLine += theme("".padStart(left - monoutil_1.consoleLn(encBottom)));
                    thisLine += encBottom;
                }
                else {
                    thisLine += theme("".padStart(this.width - monoutil_1.consoleLn(thisLine)));
                    thisLine += "\n";
                    thisLine += theme("".padStart(this.width - monoutil_1.consoleLn(encBottom))) + encBottom;
                }
            }
            else {
                thisLine += "\n";
            }
            lastLine = lineNo;
            out += thisLine;
        }
        out += "\n";
        this.stack += 1;
        if (!isDebug()) {
            return;
        }
        return this.write(out.toString());
    }
    /**
     * Get Header of logger
     *
     * [Timestamp] [Header] [typeInfo]
     * @param header To print header
     * @param typeStr To print type
     */
    getHeader(header) {
        const headerCut = monoutil_1.substrMono(header, 0, this.headerSize);
        const padLn = headerCut.content.length + this.headerSize - monoutil_1.consoleLn(headerCut.original);
        return `${this.infoTheme(" " + this.timestamp + " ")} ${headerCut.content.padStart(padLn)}`;
    }
    getMiddle(style, typeStr) {
        const cutted = monoutil_1.substrMono(typeStr, 0, this.headerSize);
        return style(` ${cutted.content.padStart(cutted.content.length + this.middleSize - cutted.original.length)} `);
    }
    getFooter(encodedCaller) {
        return ` ${encodedCaller} `;
    }
    async write(str) {
        return new Promise((res, rej) => {
            process.stdout.write(str, () => res());
        });
    }
}
exports.ChocoLog = ChocoLog;
/**
 * Get first element of array
 *
 * Null if non exists
 */
function getFirst(arr) {
    if (arr == null || arr.length < 1) {
        return null;
    }
    else {
        return arr[0];
    }
}
/**
 * Css color element to hex color string
 * @param text css text
 */
function cssToColor(text) {
    if (text == null) {
        return null;
    }
    let filter = text;
    filter = filter.substr(filter.indexOf(":") + 1).trimLeft();
    filter = filter.substring(0, filter.lastIndexOf(";"));
    filter = `#${color_1.default(filter).rgbNumber().toString(16).padStart(6, "0").toUpperCase()}`;
    return filter;
}
function regexIndexOf(text, re, i = 0) {
    const indexInSuffix = text.slice(i).search(re);
    return indexInSuffix < 0 ? indexInSuffix : indexInSuffix + i;
}
function isDebug() {
    if (process.env.DEBUG === undefined) {
        return false;
    }
    if (process.env.DEBUG === "*") {
        return true;
    }
    return false;
}
function toStringStack(stack) {
    return `${stack.getFunctionName()} (${stack.getFileName()}:${stack.getLineNumber()}:${stack.getColumnNumber()})`;
}
const chocolog = new ChocoLog();
exports.default = chocolog;
//# sourceMappingURL=log.js.map
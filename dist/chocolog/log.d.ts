import { Chalk } from "chalk";
import { Sheet } from "emphasize";
import StackTrace from "stack-trace";
import { Serializable } from "../types/serialize";
import TsMap from "./tsmap";
declare type LikeString = Serializable | Map<string | number, Serializable> | Error;
export declare class ChocoLog {
    name: string;
    protected stack: number;
    protected codeBackground: string;
    protected codeTextColor: string;
    protected codeStyle: Sheet;
    protected brightDark: string;
    protected defaultTheme: Chalk & {
        supportsColor: import("chalk").ColorSupport;
    };
    protected defaultTheme2: Chalk & {
        supportsColor: import("chalk").ColorSupport;
    };
    protected infoTheme: Chalk & {
        supportsColor: import("chalk").ColorSupport;
    };
    protected lineTheme: Chalk & {
        supportsColor: import("chalk").ColorSupport;
    };
    protected middleSize: number;
    protected subpadSize: number;
    protected cwd: string;
    protected readonly width: number;
    protected readonly headerSize: number;
    protected sourceMap: Map<string, TsMap>;
    /**
     * Debug log
     */
    d(_title: LikeString, _desc?: LikeString): Promise<void>;
    /**
     * Verbose log
     */
    v(_title: LikeString, _desc?: LikeString): Promise<void>;
    /**
     * Info log
     */
    i(_title: LikeString, _desc?: LikeString): Promise<void>;
    /**
     * Warning log
     */
    w(_title: LikeString, _desc?: LikeString): Promise<void>;
    /**
     * Error log
     */
    e(_title: LikeString, _desc?: LikeString): Promise<null>;
    /**
     * What the f***
     */
    wtf(_title: LikeString, _desc?: LikeString): Promise<void>;
    /**
     * Log programming code with auto formatter
     *
     * used `highlight.js` wrapper `emphasize`
     * @param _code Code string to print (css, js, etc...)
     * @param _title Title of log, not need at normal.
     */
    code(_code: string, _title?: LikeString): Promise<void>;
    setDefaultTheme(): Promise<{
        [x: string]: Chalk;
    }>;
    /**
     * Set `highlight.js` theme to Emphasize's styleSheet
     *
     * And maybe apply this log.
     *
     * @param css URL or raw css content
     */
    setCodeTheme(css: string): Promise<{
        [x: string]: Chalk;
    }>;
    /**
     * something to string
     * @param obj any
     */
    protected toStr(obj: any): Promise<string>;
    protected fallbackParam(title: LikeString, desc: LikeString): Promise<string[]>;
    protected encodeCaller(called: Called): string;
    protected caller(deeper: number): Promise<Called>;
    protected filterStack(stacktrace: StackTrace.StackFrame[]): StackTrace.StackFrame[];
    protected decodeStack(query: StackTrace.StackFrame): Promise<Called>;
    protected beautyCode(code: string): string;
    protected beautyJSON(json: string): string;
    protected readonly timestamp: string;
    /**
     * Print Content with split & color & beauty
     *
     * This can't be optimized.
     * @param header
     * @param content
     * @param options
     */
    protected printSimple(header: string, content: string, options: {
        tagName: string;
        colorTheme: Chalk;
        fontColor: string;
    }): Promise<void>;
    /**
     * Get Header of logger
     *
     * [Timestamp] [Header] [typeInfo]
     * @param header To print header
     * @param typeStr To print type
     */
    protected getHeader(header: string): string;
    protected getMiddle(style: Chalk, typeStr: string): string;
    protected getFooter(encodedCaller: string): string;
    protected write(str: string): Promise<void>;
}
interface Called {
    fileName: string;
    funcName: string;
    line: number;
    column: number;
}
declare const chocolog: ChocoLog;
export default chocolog;

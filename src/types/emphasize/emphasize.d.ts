/**
 * Syntax highlighting in ANSI.
 * Like highlight.js (through lowlight),
 * but for the terminal.
 */
/* tslint:disable */
declare module "emphasize" {
    import { Chalk } from "chalk"
    export function registerLanguage(name:string, xml:any):void
    /**
     * Parse `value` according to the
     * [`language`](https://github.com/highlightjs/highlight.js/blob/master/docs/css-classes-reference.rst#language-names-and-aliases)
     * grammar.
     */
    export function highlight(language:string, value:string, sheet?:Sheet):Result
    /**
     * Parse `value` by guessing its grammar.
     * 
     * `options`
     * * `subset` (default: all registered languages)
     * List of allowed languages
     */
    export function highlightAuto(value:string, sheet?:Sheet | {subset?:string[], sheet?:Sheet}):Result
    /**
     * `Result` is a highlighting result object.
     */
    export interface Result {
        /**
         * Integer representing how sure low is
         * the given codeis in the given language
         */
        relevance:number,
        /**
         * The detected `language`
         */
        language:string,
        /**
         * ANSI encoded codes
         */
        value:string,
        /**
         * Result of the second-best (based on `relevance`) match.
         * Only set by `highlightAuto`, but can still be null.
         */
        secondBest?:Result
    }
    /**
     * Sheet Type
     *
     * https://highlightjs.readthedocs.io/en/latest/css-classes-reference.html
     */
    export type Sheet = {
        [key in PropertyNames<Serializify<SheetKeys>>]? : Chalk
    }
    export type SheetKeys = [
        "keyword",
        "built_in",
        "type",
        "literal",
        "number",
        "regexp",
        "string",
        "subst",
        "symbol",
        "class",
        "function",
        "title",
        "params",
        "comment",
        "doctag",
        "meta",
        "meta-keyword",
        "meta-string",
        "section",
        "tag",
        "name",
        "builtin-name",
        "attr",
        "attribute",
        "variable",
        "bullet",
        "code",
        "emphasis",
        "strong",
        "formula",
        "link",
        "quote",
        "addition",
        "deletion",
    ]
    type PropertyNames<T extends string[]> = {
        // tslint:disable-next-line
        [K in keyof T]: T[K] extends Function ? never :
        T[K] extends string ? T[K] :
        never
    }[keyof T]

    /**
     * Serializify library
     */
    /* tslint:disable */
    type Serializable = string | number | boolean | SerializeObject | SerializeArray
    interface SerializeObject {
        [x: string]: Serializable;
    }
    interface SerializeArray extends Array<Serializable> { }
    /**
     * Serializify type
     */
    // support type
    type Diff<T, U> = T extends U ? never : T;  // Remove types from T that are assignable to U
    type Filter<T, U> = T extends U ? T : never;  // Remove types from T that are not assignable to U
    type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
    type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
    type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
    type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
    type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
    type SerializablePropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : (T[K] extends Serializable ? K : never) }[keyof T];
    type SerializableProperties<T> = Pick<T, SerializablePropertyNames<T>>;
    // serializify
    /**
     * Remove all non-serialize properties
     * 
     * Recursive
     */
    type Serializify<T> =
        T extends (infer R)[] ? SerialArray<R> :
        T extends Function ? never :
        T extends object ? SerialObject<T> :
        T extends Serializable ? T :
        never;
    type SerialObject<T> = SerializableProperties<{
        [P in keyof T]: Serializify<T[P]>
    }>
    interface SerialArray<T> extends Array<Serializify<T>> { }
    // functional
    type Functional<T> = FunctionProperties<T>
}

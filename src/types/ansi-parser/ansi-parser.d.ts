declare module "ansi-parser" {
    /**
     * Parses the string containing ANSI styles.
     *
     * @param input The input string
     * @returns An array of `{style:ANSI, content:string}`
     */
    export function parse(input:string):Array<{ style:string, content:string }>
    /**
     * Returns the content and ANSI style at known index.
     * @param input The input string.
     * @param noAnsi The input string without containing ansi styles.
     * @param index The character index.
     * @returns `Object` An AnsiOutput
     */
    export function getAtIndex(input:string, noAnsi:string, index:number):{ style:string, content:string }
    /**
     * Removes ANSI styles from the input string.
     * @param input The input string.
     * @returns The string without ANSI styles.
     */
    export function removeAnsi(input:string):string
}

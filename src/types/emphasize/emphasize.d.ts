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
    export function highlight(language:HlLanguage, value:string, sheet?:Sheet):Result
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
    /**
     * Language Type
     * 
     * https://github.com/highlightjs/highlight.js/blob/master/docs/css-classes-reference.rst#language-names-and-aliases
     */
    export type HlLanguage = PropertyNames<Serializify<HlAliases>>
    type PropertyNames<T extends string[]> = {
        // tslint:disable-next-line
        [K in keyof T]: T[K] extends Function ? never :
        T[K] extends string ? T[K] :
        never
    }[keyof T]
    /**
     * Style Keys
     */
    type SheetKeys = [
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
    /**
     * https://raw.githubusercontent.com/highlightjs/highlight.js/master/docs/css-classes-reference.rst
     * 
     * Replace `\+.+\+` to ``
     * 
     * Replace `^\|.+?\|\s*` to ``
     * 
     * Replace `\s+\|\s+` to `,\n`
     * 
     * Replace `\,\s*\,` to `,`
     * 
     * Replace `[A-Za-z0-9\-\_\.]+` to `"$0"`
     */
    type HlAliases = [
        "1c",
        "abnf",
        "accesslog",
        "ada",
        "armasm", "arm",
        "avrasm",
        "actionscript", "as",
        "angelscript", "asc",
        "apache", "apacheconf",
        "applescript", "osascript",
        "arcade",
        "asciidoc", "adoc",
        "aspectj",
        "autohotkey",
        "autoit",
        "awk", "mawk", "nawk", "gawk",
        "axapta",
        "bash", "sh", "zsh",
        "basic",
        "bnf",
        "brainfuck", "bf",
        "cs", "csharp",
        "cal",
        "cos", "cls",
        "cmake", "cmake.in",
        "coq",
        "csp",
        "css",
        "capnproto", "capnp",
        "clojure", "clj",
        "coffeescript", "coffee", "cson", "iced",
        "crmsh", "crm", "pcmk",
        "crystal", "cr",
        "d",
        "dns", "zone", "bind",
        "dos", "bat", "cmd",
        "dart",
        "delphi", "dpr", "dfm", "pas", "pascal", "freepascal",
        "lazarus", "lpr", "lfm",
        "diff", "patch",
        "django", "jinja",
        "dockerfile", "docker",
        "dsconfig",
        "dts",
        "dust", "dst",
        "ebnf",
        "elixir",
        "elm",
        "erlang", "erl",
        "excel", "xls", "xlsx",
        "fsharp", "fs",
        "fix",
        "fortran", "f90", "f95",
        "gcode", "nc",
        "gams", "gms",
        "gauss", "gss",
        "gherkin",
        "go", "golang",
        "golo", "gololang",
        "gradle",
        "groovy",
        "xml", "html", "xhtml", "rss", "atom", "xjb", "xsd", "xsl", "plist",
        "http", "https",
        "haml",
        "handlebars", "hbs", "html.hbs", "html.handlebars",
        "haskell", "hs",
        "haxe", "hx",
        "hy", "hylang",
        "ini", "toml",
        "inform7", "i7",
        "irpf90",
        "json",
        "java", "jsp",
        "javascript", "js", "jsx",
        "kotlin", "kt",
        "leaf",
        "lasso", "ls", "lassoscript",
        "less",
        "ldif",
        "lisp",
        "livecodeserver",
        "livescript", "ls",
        "lua",
        "makefile", "mk", "mak",
        "markdown", "md", "mkdown", "mkd",
        "mathematica", "mma",
        "matlab",
        "maxima",
        "mel",
        "mercury",
        "mizar",
        "mojolicious",
        "monkey",
        "moonscript", "moon",
        "n1ql",
        "nsis",
        "nginx", "nginxconf",
        "nimrod", "nim",
        "nix",
        "ocaml", "ml",
        "objectivec", "mm", "objc", "obj-c",
        "glsl",
        "openscad", "scad",
        "ruleslanguage",
        "oxygene",
        "pf", "pf.conf",
        "php", "php3", "php4", "php5", "php6",
        "parser3",
        "perl", "pl", "pm",
        "plaintext",
        "pony",
        "pgsql", "postgres", "postgresql",
        "powershell", "ps",
        "processing",
        "prolog",
        "properties",
        "protobuf",
        "puppet", "pp",
        "python", "py", "gyp",
        "profile",
        "k", "kdb",
        "qml",
        "r",
        "reasonml", "re",
        "rib",
        "rsl",
        "graph", "instances",
        "ruby", "rb", "gemspec", "podspec", "thor", "irb",
        "rust", "rs",
        "scss",
        "sql",
        "p21", "step", "stp",
        "scala",
        "scheme",
        "scilab", "sci",
        "shell", "console",
        "smali",
        "smalltalk", "st",
        "stan",
        "stata",
        "SAS", "sas",
        "stylus", "styl",
        "subunit",
        "swift",
        "tap",
        "tcl", "tk",
        "tex",
        "thrift",
        "tp",
        "twig", "craftcms",
        "typescript", "ts",
        "vbnet", "vb",
        "vbscript", "vbs",
        "vhdl",
        "vala",
        "verilog", "v",
        "vim",
        "x86asm",
        "xl", "tao",
        "xquery", "xpath", "xq",
        "yml", "yaml",
        "zephir", "zep",
    ]
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
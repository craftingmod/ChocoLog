import { LogLv } from "./loglv"
export const hueColors = {
    verbose: 336,
    debug: 206,
    info: 122,
    warn: 35,
    error: 4,
    assert: 294,
}
export type TypeColors = {
    [K in keyof typeof hueColors]: string
}
/*
    protected typedColors = {
        verbose: "#e09db8",
        debug: "#8dc7f4",
        info: "#94e897",
        warn: "#fcc385",
        error: "#f9756b",
        assert: "#f1a5ff",
    }
*/

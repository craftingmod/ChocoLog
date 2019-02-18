// tslint:disable
export enum LogLv {
    ALL=0,
    VERBOSE=1,
    DEBUG=2,
    INFO=3,
    WARN=4,
    ERROR=5,
    ASSERT=6,
    SILENT=7,
}
export const LogLvStatic:BindEnum<typeof LogLv> = {
    ALL:LogLv.ALL,
    VERBOSE:LogLv.VERBOSE,
    DEBUG:LogLv.DEBUG,
    INFO:LogLv.INFO,
    WARN:LogLv.WARN,
    ERROR:LogLv.ERROR,
    ASSERT:LogLv.ASSERT,
    SILENT:LogLv.SILENT,
}
type BindEnum<T extends object> = {
    [K in keyof T] : T[K]
}
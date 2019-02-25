import chalk from "chalk"
import stringify from "stringify-object"
import { ansiExp } from "./monoutil"

export const forceIndenter = `\u{FFF5}_#>`
export const valNameIndenter = `\u{FFF5}_N>`
export const indenter = "  "

export function forceIndent(str:string) {
    const splited = str.split("\n")
    return splited.map((v, i) => {
        if (i === 0) {
            return v
        } else if (i === splited.length - 1 && v.trim() === "}") {
            return forceIndenter + v
        } else {
            return forceIndenter + v
        }
    }).join("\n")
}
export function encodeNo(num:number) {
    const str = [...num.toString(10)]
    const out = []
    for (const chNum of str) {
        out.push((Number.parseInt(chNum) + 10).toString(36))
    }
    return out.join("")
}
export function decodeNo(num:string) {
    const str = [...num]
    const out = []
    for (const chNum of str) {
        out.push((Number.parseInt(chNum, 36) - 10).toString(10))
    }
    return Number.parseInt(out.join(""))
}

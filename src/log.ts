import wcwidth from "wcwidth"

export class ChocoLog {

}
export function unicodeLn(text:string) {
    if (text.indexOf("\n") >= 0) {
        return -1
    }
    let ln = 0
    for (let i = 0; i < text.length; i += 1) {
        const char = text.charAt(i)
        if (char === "\t") {
            ln = Math.ceil((ln + 1) / 4) * 4
            continue
        }
        ln += wcwidth(char)
    }
    return ln
}
export function substringMono(text:string, start:number, end:number, floor = true) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.")
    }
    let out:string = ""
    let ln = 0
    for (let i = 0; i < text.length; i += 1) {
        const char = text.charAt(i)
        const oldLn = ln
        if (char === "\t") {
            ln = Math.ceil((ln + 1) / 4) * 4
        } else {
            ln += wcwidth(char)
        }
        if (floor && ln > end) {
            break
        }
        if ((floor && start >= oldLn) || (!floor && start >= ln)) {
            out += char
        }
        if (!floor && ln >= end) {
            break
        }
    }
    return out
}

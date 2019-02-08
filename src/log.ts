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
export function substrMono(text:string, start:number, length:number) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.")
    }
    // https://stackoverflow.com/a/34717402
    const charsets = [...text]
    // https://stackoverflow.com/questions/45803829/memory-overhead-of-typed-arrays-vs-strings
    // tslint:disable-next-line
    let out = new String()
    const tab = "\t"
    let totalLn = 0
    let untilLn = 0
    for (let i = 0; i < charsets.length; i += 1) {
        const char = text[i]
        const ln = wcwidth(char)
        if (char === tab) {
            totalLn = Math.ceil((totalLn + 1) / 4) * 4
        } else {
            totalLn += ln
        }
        if (i < start) {
            continue
        } else if (untilLn === 0) {
            untilLn = totalLn - ln + length
        }
        if (totalLn <= untilLn) {
            out += char
        } else {
            break
        }
    }
    return out
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ansi_parser_1 = __importDefault(require("ansi-parser"));
const ansi_regex_1 = __importDefault(require("ansi-regex"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const wcwidth_1 = __importDefault(require("wcwidth"));
/**
 * Calculate for console print's length
 * @param text Text
 */
function consoleLn(text) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.");
    }
    let ln = 0;
    const arr = [...strip_ansi_1.default(text)];
    for (const char of arr) {
        if (char === "\t") {
            ln = Math.ceil((ln + 1) / 4) * 4;
            continue;
        }
        ln += wcwidth_1.default(char);
    }
    return ln;
}
exports.consoleLn = consoleLn;
/**
 * Monospace version of padStart
 * @param text
 * @param length
 * @param fillText
 */
function padStartMono(text, length, fillText = " ") {
    const monoLn = consoleLn(text);
    return text.padStart(text.length + Math.max(0, length - monoLn), fillText);
}
exports.padStartMono = padStartMono;
/**
 * Monospace version of padEnd
 * @param text
 * @param length
 * @param fillText
 */
function padEndMono(text, length, fillText = " ") {
    const monoLn = consoleLn(text);
    return text.padEnd(text.length + Math.max(0, length - monoLn), fillText);
}
exports.padEndMono = padEndMono;
/**
 * .
 * @param text To substr text with ANSI
 * @param start start position **without ANSI**
 * @param length Max length to substr **without ANSI**
 */
function substrMono(text, start, length) {
    if (text.indexOf("\n") >= 0) {
        throw new Error("Line seperator didn't allowed.");
    }
    // https://stackoverflow.com/a/34717402
    const charsets = [...strip_ansi_1.default(text)];
    // https://stackoverflow.com/questions/45803829/memory-overhead-of-typed-arrays-vs-strings
    // tslint:disable-next-line
    let out = [];
    // ansi escape positions
    const ansiCodes = ansi_regex_1.default().test(text) ? text.match(ansi_regex_1.default()) : [];
    const ansiPosInfo = text.split(ansi_regex_1.default()).map((v) => v.length);
    for (let i = 0; i < ansiPosInfo.length; i += 1) {
        if (i >= 1) {
            ansiPosInfo[i] += ansiPosInfo[i - 1];
        }
    }
    // process
    const tab = "\t";
    let totalLn = 0;
    let skippedCount = 0;
    let untilLn = 0;
    for (let i = 0; i < charsets.length; i += 1) {
        const char = charsets[i];
        const ln = wcwidth_1.default(char);
        if (char === tab) {
            totalLn = Math.ceil((totalLn + 1) / 4) * 4;
        }
        else {
            totalLn += ln;
        }
        if (i < start) {
            skippedCount += 1;
            continue;
        }
        else if (untilLn === 0) {
            untilLn = totalLn - ln + length;
        }
        if (totalLn <= untilLn) {
            out.push(char);
        }
        else {
            break;
        }
    }
    // add ansi after process
    const orgText = out.join("");
    let asOffset = 0;
    for (let i = 0; i < ansiCodes.length; i += 1) {
        const insert = ansiPosInfo[i] + asOffset - skippedCount;
        if (insert >= 0 && insert < out.length) {
            out.splice(insert, 0, ansiCodes[i]);
            asOffset += 1;
        }
    }
    const styleText = out.join("");
    return {
        original: orgText,
        content: styleText,
        lastStyle: ansi_parser_1.default.getAtIndex(styleText, orgText, orgText.length - 1).style,
    };
}
exports.substrMono = substrMono;
//# sourceMappingURL=monoutil.js.map
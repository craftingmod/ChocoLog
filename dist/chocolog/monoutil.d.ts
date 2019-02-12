/**
 * Calculate for console print's length
 * @param text Text
 */
export declare function consoleLn(text: string): number;
/**
 * Monospace version of padStart
 * @param text
 * @param length
 * @param fillText
 */
export declare function padStartMono(text: string, length: number, fillText?: string): string;
/**
 * Monospace version of padEnd
 * @param text
 * @param length
 * @param fillText
 */
export declare function padEndMono(text: string, length: number, fillText?: string): string;
/**
 * .
 * @param text To substr text with ANSI
 * @param start start position **without ANSI**
 * @param length Max length to substr **without ANSI**
 */
export declare function substrMono(text: string, start: number, length: number): {
    original: string;
    content: string;
    lastStyle: string;
};

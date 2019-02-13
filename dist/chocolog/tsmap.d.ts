export default class TsMap {
    static from(mapPath: string): Promise<TsMap>;
    protected jsPath: string;
    protected tsPath: string;
    /**
     * **0-based** Mapping map
     *
     * Key: Line
     *
     * Value: Array of Columns.
     */
    protected mapping: Map<number, Array<[number, number, number]>>;
    private constructor();
    /**
     * 0-index
     *
     * Get Typescript's line from Javascript's line
     * @param jsLine Javascript line
     */
    getTSLine(jsLine: number): [number, number, number] | -1;
    /**
     * Get mapping info from
     * `zeroLine` - Row(n줄), `zeroIndex` - Column(n번째 문자)
     *
     * If non exists, return null.
     * @param zeroLine 0-index line
     * @param zeroIndex 0-index column
     */
    getMapping(zeroLine: number, zeroIndex: number): TsMapColumn;
    /**
     * 1-index
     *
     * Just 1-index version of getMapping.
     * @param line 1-index line
     * @param column 1-index column
     */
    decodePoint(line: number, column: number): TsMapColumn;
    getFilePath(): string;
}
interface TsMapColumn {
    jsColumn: number;
    tsColumn: number;
    tsRow: number;
}
export {};

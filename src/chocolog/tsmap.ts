import fs from "fs-extra"
import path from "path"
const vlq:{decode:(str:string) => number[], encode:(value:number | number[]) => string} = require("vlq")

export default class TsMap {
    public static async from(mapPath:string) {
        mapPath = path.resolve(mapPath)
        return new TsMap(mapPath, await fs.readJSON(mapPath))
    }
    protected jsPath:string
    protected tsPath:string
    /**
     * **0-based** Mapping map
     *
     * Key: Line
     *
     * Value: Array of Columns.
     */
    protected mapping:Map<number, Array<[number, number, number]>> = new Map()
    private constructor(mapPath:string, json:TsMapFile) {
        const dirPath = mapPath.substring(0, mapPath.lastIndexOf(path.sep))
        this.jsPath = json.file
        this.tsPath = path.resolve(dirPath, json.sources[0])
        const nMaps = json.mappings.split(";")
            .map((v) => v.split(","))
            .map((arr) => arr.map((v) => {
                if (v == null || v.length <= 0) {
                    return [0, 0, 0, 0]
                } else {
                    return vlq.decode(v)
                }
            }))
        /**
         * Idk well.
         *
         * https://github.com/Rich-Harris/vlq/tree/master/sourcemaps
         */
        let sourceFileIndex = 0     // second field
        let sourceCodeLine = 0      // third field
        let sourceCodeColumn = 0    // fourth field
        let nameIndex = 0           // fifth field
        const decoded = nMaps.map((line) => {
            let generatedCodeColumn = 0
            return line.map((segment) => {
                let result:number[]
                generatedCodeColumn += segment[0]
                result = [generatedCodeColumn]
                if (segment.length === 1) {
                    return result
                }

                sourceFileIndex += segment[1]
                sourceCodeLine += segment[2]
                sourceCodeColumn += segment[3]

                result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn)
                if (segment.length === 5) {
                    nameIndex += segment[4]
                    result.push(nameIndex)
                }
                return result
            })
        })
        for (let i = 0; i < decoded.length; i += 1) {
            const jsLines = decoded[i]
            const column:Array<[number, number, number]> = []
            for (const jsLine of jsLines) {
                // jsColumn, tsColumn, tsRow
                column.push([jsLine[0], jsLine[3], jsLine[2]])
            }
            this.mapping.set(i, column)
        }
    }
    /**
     * 0-index
     *
     * Get Typescript's line from Javascript's line
     * @param jsLine Javascript line
     */
    public getTSLine(jsLine:number) {
        if (!this.mapping.has(jsLine)) {
            return -1
        }
        const arr = this.mapping.get(jsLine)
        if (arr == null || arr.length < 1) {
            return null
        }
        return arr[0]
    }
    /**
     * Get mapping info from
     * `zeroLine` - Row(n줄), `zeroIndex` - Column(n번째 문자)
     *
     * If non exists, return null.
     * @param zeroLine 0-index line
     * @param zeroIndex 0-index column
     */
    public getMapping(zeroLine:number, zeroIndex:number) {
        if (!this.mapping.has(zeroLine)) {
            return null
        }
        const mapColumn = this.mapping.get(zeroLine).find((v) => v[0] === zeroIndex)
        if (mapColumn == null) {
            return null
        }
        return {
            jsColumn: mapColumn[0],
            tsColumn: mapColumn[1],
            tsRow: mapColumn[2],
        } as TsMapColumn
    }
    /**
     * 1-index
     *
     * Just 1-index version of getMapping.
     * @param line 1-index line
     * @param column 1-index column
     */
    public decodePoint(line:number, column:number) {
        line -= 1
        column -= 1
        const mp = this.getMapping(line, column)
        mp.jsColumn += 1
        mp.tsColumn += 1
        mp.tsRow += 1
        return mp
    }
    public getFilePath(cwd:string, absolute = false) {
        if (cwd.endsWith(path.sep)) {
            cwd = cwd.substring(0, cwd.length - 1)
        }
        if (!absolute && this.tsPath.startsWith(cwd)) {
            return this.tsPath.replace(cwd, ".")
        }
        return this.tsPath
    }
}
interface TsMapFile {
    version:number;
    file:string;
    sourceRoot:string;
    sources:string[];
    names:string[];
    mappings:string;
}
interface TsMapColumn {
    jsColumn:number;
    tsColumn:number;
    tsRow:number;
}

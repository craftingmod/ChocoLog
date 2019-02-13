"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vlq = require("vlq");
class TsMap {
    constructor(mapPath, json) {
        /**
         * **0-based** Mapping map
         *
         * Key: Line
         *
         * Value: Array of Columns.
         */
        this.mapping = new Map();
        const dirPath = mapPath.substring(0, mapPath.lastIndexOf(path_1.default.sep));
        this.jsPath = json.file;
        this.tsPath = path_1.default.resolve(dirPath, json.sources[0]);
        const nMaps = json.mappings.split(";")
            .map((v) => v.split(","))
            .map((arr) => arr.map((v) => {
            if (v == null || v.length <= 0) {
                return [0, 0, 0, 0];
            }
            else {
                return vlq.decode(v);
            }
        }));
        /**
         * Idk well.
         *
         * https://github.com/Rich-Harris/vlq/tree/master/sourcemaps
         */
        let sourceFileIndex = 0; // second field
        let sourceCodeLine = 0; // third field
        let sourceCodeColumn = 0; // fourth field
        let nameIndex = 0; // fifth field
        const decoded = nMaps.map((line) => {
            let generatedCodeColumn = 0;
            return line.map((segment) => {
                let result;
                generatedCodeColumn += segment[0];
                result = [generatedCodeColumn];
                if (segment.length === 1) {
                    return result;
                }
                sourceFileIndex += segment[1];
                sourceCodeLine += segment[2];
                sourceCodeColumn += segment[3];
                result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn);
                if (segment.length === 5) {
                    nameIndex += segment[4];
                    result.push(nameIndex);
                }
                return result;
            });
        });
        for (let i = 0; i < decoded.length; i += 1) {
            const jsLines = decoded[i];
            const column = [];
            for (const jsLine of jsLines) {
                // jsColumn, tsColumn, tsRow
                column.push([jsLine[0], jsLine[3], jsLine[2]]);
            }
            this.mapping.set(i, column);
        }
    }
    static async from(mapPath) {
        mapPath = path_1.default.resolve(mapPath);
        return new TsMap(mapPath, await fs_extra_1.default.readJSON(mapPath));
    }
    /**
     * 0-index
     *
     * Get Typescript's line from Javascript's line
     * @param jsLine Javascript line
     */
    getTSLine(jsLine) {
        if (!this.mapping.has(jsLine)) {
            return -1;
        }
        const arr = this.mapping.get(jsLine);
        if (arr == null || arr.length < 1) {
            return null;
        }
        return arr[0];
    }
    /**
     * Get mapping info from
     * `zeroLine` - Row(n줄), `zeroIndex` - Column(n번째 문자)
     *
     * If non exists, return null.
     * @param zeroLine 0-index line
     * @param zeroIndex 0-index column
     */
    getMapping(zeroLine, zeroIndex) {
        if (!this.mapping.has(zeroLine)) {
            return null;
        }
        const mapColumn = this.mapping.get(zeroLine).find((v) => v[0] === zeroIndex);
        if (mapColumn == null) {
            return null;
        }
        return {
            jsColumn: mapColumn[0],
            tsColumn: mapColumn[1],
            tsRow: mapColumn[2],
        };
    }
    /**
     * 1-index
     *
     * Just 1-index version of getMapping.
     * @param line 1-index line
     * @param column 1-index column
     */
    decodePoint(line, column) {
        line -= 1;
        column -= 1;
        const mp = this.getMapping(line, column);
        mp.jsColumn += 1;
        mp.tsColumn += 1;
        mp.tsRow += 1;
        return mp;
    }
    getFilePath() {
        return this.tsPath;
    }
}
exports.default = TsMap;
//# sourceMappingURL=tsmap.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const canvas_1 = require("canvas");
const emoji_unicode_1 = __importDefault(require("emoji-unicode"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const image_size_1 = __importDefault(require("image-size"));
const minda_ts_1 = require("minda-ts");
const node_fetch_1 = __importDefault(require("node-fetch"));
const sharp_1 = __importDefault(require("sharp"));
const snowconfig_1 = require("../snow/config/snowconfig");
async function renderBoard(board, pallate = {}, sideinfo = {}) {
    // load font
    const ttf = `${snowconfig_1.debugPath}/res/NanumSquareRoundR.ttf`;
    canvas_1.registerFont(ttf, { family: "NanumSquareRound" });
    // define size
    const hexagonSize = 1500;
    const frameWidth = Math.floor(hexagonSize * 1.2211);
    const circleFR = Math.floor(frameWidth * 1.1);
    const canvas = canvas_1.createCanvas(circleFR, circleFR, "PDF");
    // load frame
    const frameBuffer = await fs_extra_1.default.readFile(`${snowconfig_1.debugPath}/res/board.png`);
    const frameSizeI = image_size_1.default(frameBuffer);
    const scaledFrameH = Math.floor(frameSizeI.height / frameSizeI.width * frameWidth);
    const frame = await sharp_1.default(frameBuffer)
        .resize(frameWidth, scaledFrameH, { fit: "inside" })
        .toBuffer().then(loadImage);
    const ctx = canvas.getContext("2d");
    // draw circle
    ctx.beginPath();
    const r = circleFR / 2;
    ctx.arc(r, r, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#f9edca";
    ctx.fill();
    // draw frame
    ctx.drawImage(frame, (circleFR - frameWidth) / 2, (circleFR - scaledFrameH) / 2);
    await drawHexagon(ctx, [Math.floor(circleFR / 2), Math.floor(circleFR / 2)], hexagonSize, "#2c2c2a", {
        board,
        blackImage: pallate.black,
        whiteImage: pallate.white,
        noStoneImage: pallate.default,
    });
    // draw userinfo
    const infoSize = Math.floor(hexagonSize / 8);
    const defaultPic = await fs_extra_1.default.readFile(`${snowconfig_1.debugPath}/res/placeHolderProfileImage.png`);
    // copy
    if (sideinfo.black != null) {
        if (sideinfo.black.image == null) {
            sideinfo.black.image = defaultPic;
        }
        await drawPicture(ctx, "left", {
            at: [(circleFR - infoSize * 3) / 2, 0],
            size: infoSize,
            backColor: "#222222",
            textColor: "#eeeeee",
            stone: sideinfo.black.stone,
            maxStone: sideinfo.maxstone,
        }, sideinfo.black.image, sideinfo.black.username);
    }
    // paste
    if (sideinfo.white != null) {
        if (sideinfo.white.image == null) {
            sideinfo.white.image = defaultPic;
        }
        await drawPicture(ctx, "right", {
            at: [(circleFR - infoSize * 3) / 2, circleFR - infoSize],
            size: infoSize,
            backColor: "#eeeeee",
            textColor: "#222222",
            stone: sideinfo.white.stone,
            maxStone: sideinfo.maxstone,
        }, sideinfo.white.image, sideinfo.white.username);
    }
    const buffer = canvas.toBuffer();
    return buffer;
}
exports.renderBoard = renderBoard;
/**
 * Draw hexagon
 * @param ctx Context
 * @param centerPoint Center point of hexagon
 * @param hexaLength Hexagon's longest width
 * @param bgColor Background color
 * @param params Original parameters
 */
async function drawHexagon(ctx, centerPoint, hexaLength, bgColor, params) {
    // 0. config (0 < x <= 1/2)
    const elSize = 2 / 5;
    const { board, blackImage, whiteImage, noStoneImage } = params;
    /* first: parse color */
    const parseColor = (str, fault) => {
        if (str != null && str.startsWith("#") && /^#[0-9A-Fa-f]{6}$/ig.test(str)) {
            return str.toUpperCase();
        }
        else {
            return fault.toUpperCase();
        }
    };
    const colors = {
        black: parseColor(blackImage, "#eeeeee"),
        white: parseColor(whiteImage, "#111111"),
        default: parseColor(noStoneImage, "#ffefbc"),
    };
    /* and draw background */
    if (bgColor != null) {
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        const [cx, cy] = centerPoint;
        ctx.moveTo(Math.floor(cx - hexaLength / 2), cy);
        ctx.lineTo(Math.floor(cx - hexaLength / 4), Math.floor(cy - Math.sqrt(3) * hexaLength / 4));
        ctx.lineTo(Math.floor(cx + hexaLength / 4), Math.floor(cy - Math.sqrt(3) * hexaLength / 4));
        ctx.lineTo(Math.floor(cx + hexaLength / 2), cy);
        ctx.lineTo(Math.floor(cx + hexaLength / 4), Math.floor(cy + Math.sqrt(3) * hexaLength / 4));
        ctx.lineTo(Math.floor(cx - hexaLength / 4), Math.floor(cy + Math.sqrt(3) * hexaLength / 4));
        ctx.lineTo(Math.floor(cx - hexaLength / 2), cy);
        ctx.closePath();
        ctx.fill();
    }
    /* second: define constans */
    hexaLength = Math.floor(hexaLength * board.sqaureSize / (board.sqaureSize + Math.sqrt(2) - 1));
    // 1 * l / (2n)
    const oneX = hexaLength / (2 * board.sqaureSize);
    // 3^(1/2)l / (2n)
    const oneY = Math.sqrt(3) * hexaLength / (2 * board.sqaureSize);
    // stone/image width (not radios but width)
    const elementWidth = 2 * hexaLength * elSize / board.sqaureSize;
    /* third: draw */
    // load image
    const getImage = async (url) => {
        if (url == null || !url.startsWith("http")) {
            return null;
        }
        let binary = await node_fetch_1.default(url).then((v) => v.buffer());
        const roundedCorners = Buffer.from(`<svg><rect x="0" y="0" width="${elementWidth}" height="${elementWidth}" rx="${elementWidth}" ry="${elementWidth}"/></svg>`
            // `<svg><circle cx="${elementWidth / 2} cy="${elementWidth / 2}" r="${elementWidth / 2}"/></svg>`
        );
        binary = await sharp_1.default(binary)
            .resize(Math.ceil(elementWidth))
            .overlayWith(roundedCorners, { cutout: true })
            .toBuffer();
        return new Promise((res, rej) => {
            const img = new canvas_1.Image();
            img.onload = () => res(img);
            img.onerror = (err) => { res(null); };
            img.src = binary;
        });
    };
    const images = {
        black: await getImage(blackImage),
        white: await getImage(whiteImage),
        default: await getImage(noStoneImage),
    };
    /**
     * Get XY, draw image or circle to position.
     */
    const grid = board.decodedGrid;
    for (let row = 0; row < grid.length; row += 1) {
        for (let column = 0; column < grid[row].length; column += 1) {
            const stone = grid[row][column];
            const x = Math.floor(centerPoint[0] +
                (Math.abs(board.centerPosition - row) + 2 * (column - board.centerPosition)) * oneX);
            const y = Math.floor(centerPoint[1] + (row - board.centerPosition) * oneY);
            const drawCircle = (fillColor, r) => {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI, false);
                ctx.fillStyle = fillColor;
                ctx.fill();
            };
            const drawImage = (fillImage, cornerColor, r) => {
                ctx.drawImage(fillImage, Math.floor(x - r), Math.floor(y - r), Math.round(r * 2), Math.round(r * 2));
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI, false);
                ctx.strokeStyle = cornerColor;
                ctx.lineWidth = Math.min(3, Math.floor(r / 20));
                ctx.stroke();
            };
            const draw = (fillImage, fillColor, smallsize) => {
                let r = elementWidth / 2;
                if (smallsize) {
                    r *= 0.7;
                    r = Math.round(r);
                }
                if (fillImage != null) {
                    drawImage(fillImage, "#333333", r);
                }
                else {
                    drawCircle(fillColor, r);
                }
            };
            switch (stone) {
                case minda_ts_1.StoneType.black:
                    {
                        draw(images.black, colors.black, false);
                    }
                    break;
                case minda_ts_1.StoneType.white:
                    {
                        draw(images.white, colors.white, false);
                    }
                    break;
                case minda_ts_1.StoneType.void:
                    {
                        draw(images.default, colors.default, true);
                    }
                    break;
            }
        }
    }
}
async function drawPicture(ctx, align, params, image, username) {
    const alignLeft = align === "left";
    const { at, size, backColor, textColor } = params;
    let [x, y] = at;
    x = Math.floor(x);
    y = Math.floor(y);
    const tagWidth = Math.floor(size * 3);
    const tagHeight = Math.floor(size);
    const padding = Math.floor(size * 0.1);
    const pos = [x, y];
    // background
    ctx.fillStyle = backColor;
    ctx.fillRect(x, y, tagWidth, tagHeight);
    const padPicSize = tagHeight - 2 * padding;
    // move poistion
    if (alignLeft) {
        pos[0] += padding;
        pos[1] += padding;
    }
    else {
        pos[0] += tagWidth - padding - padPicSize;
        pos[1] += padding;
    }
    // image
    const picture = await sharp_1.default(image)
        .resize(padPicSize, padPicSize, { fit: "contain", position: "center", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer().then(loadImage);
    ctx.drawImage(picture, pos[0], pos[1]);
    // image stroke
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.fillStyle = "#111111";
    ctx.strokeRect(pos[0], pos[1], padPicSize, padPicSize);
    // ctx.fillRect(x + padPicture, y + padPicture, padPicSize, padPicSize)
    // move position
    const textWidth = Math.floor(tagWidth - (padPicSize + padding * 3));
    const fontSize = Math.floor((tagHeight - 3 * padding) / 2);
    if (alignLeft) {
        pos[0] += padding + padPicSize;
    }
    else {
        pos[0] -= padding;
    }
    pos[1] += fontSize;
    if (!alignLeft) {
        ctx.textAlign = "right";
    }
    // nickname
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px NanumSquareRound`;
    ctx.fillText(username, pos[0], pos[1], Math.floor(tagWidth - (padPicSize + padding * 3)));
    // thinking
    pos[1] = y + tagHeight - 2 * padding;
    const getNum = (num) => {
        if (num == null || num < 0) {
            return "?";
        }
        else {
            return num.toString();
        }
    };
    ctx.fillText(`\u{25EF} ${getNum(params.stone)}/${getNum(params.maxStone)}`, pos[0], pos[1], Math.floor(tagWidth - (padPicSize + padding * 3)));
    return [tagWidth, tagHeight];
}
function loadImage(url) {
    return new Promise((res, rej) => {
        const img = new canvas_1.Image();
        img.onload = () => res(img);
        img.onerror = (err) => {
            console.log(err);
            res(null);
        };
        img.src = url;
    });
}
function emojiAsSVG(emoji) {
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/11.2.0/2/svg/${emoji_unicode_1.default(emoji).toLowerCase()}.svg`;
}
exports.emojiAsSVG = emojiAsSVG;
function getFillString(str, length) {
    let s = "";
    for (let i = 0; i < length; i += 1) {
        s += str;
    }
    return s;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9hcmRyZW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2hhdGJvdC9ib2FyZHJlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLG1DQUFxRTtBQUNyRSxrRUFBd0M7QUFDeEMsd0RBQXlCO0FBQ3pCLDREQUErQjtBQUMvQix1Q0FBb0Q7QUFDcEQsNERBQThCO0FBQzlCLGtEQUF5QjtBQUN6QiwwREFBcUQ7QUFJOUMsS0FBSyxVQUFVLFdBQVcsQ0FBQyxLQUFZLEVBQUUsVUFJM0MsRUFBRSxFQUFFLFdBSUosRUFBRTtJQUNILFlBQVk7SUFDWixNQUFNLEdBQUcsR0FBRyxHQUFHLHNCQUFTLDRCQUE0QixDQUFBO0lBQ3BELHFCQUFZLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtJQUNqRCxjQUFjO0lBQ2QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFBO0lBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFBO0lBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFBO0lBQzdDLE1BQU0sTUFBTSxHQUFHLHFCQUFZLENBQ3ZCLFFBQVEsRUFDUixRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDcEIsYUFBYTtJQUNiLE1BQU0sV0FBVyxHQUFHLE1BQU0sa0JBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxzQkFBUyxnQkFBZ0IsQ0FBQyxDQUFBO0lBQ25FLE1BQU0sVUFBVSxHQUFHLG9CQUFNLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDdEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUE7SUFDbEYsTUFBTSxLQUFLLEdB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
# Chocolog

## Usage
```typescript
import { cLog } from "chocolog"
// access directly
cLog.d("🤔")
// create instance with name
const log = cLog.getLogger("tsmap")
log.d("🤔")
```
Parameters length can be `1` or `2+`
```typescript
// content with default header(name)
cLog.d("🤔")
// content with custom header (first param)
cLog.d("thinking face", "🤔")
// multiple content (joining all) params with custom header
cLog.d("faces", "🤔", "🙃", "😗")
```
![alt text](./img/basic_param.png)

Parameters type can be anything (but recommend *Serializable*)
```typescript
// primitive type
cLog.i("Primitives", 37, " ", true, " ", null)
// simple object
cLog.i("Object", {
    thinking: "🤔",
    upsideDown: "🙃",
})
// array
cLog.i(["LoLInsect", "Detected"])
// map
const mp = new Map<string, string>()
mp.set("Top", "Teemo")
mp.set("Mid", "Riven")
mp.set("ADCarry", "Ezreal")
cLog.i("Loading", mp)
// Error
cLog.i("Oops", new Error("Trolling"))
// Function.. (not correctly)
cLog.i("Fn", (str:string) => `Hello, ${str}!`)
```
![param type](./img/param_type.png)
## API
### `cLog.d(title[, ...desc])`

## Call Origin (Experimental)
Due to some limitation to parse call origin, default is disabled to use call origin.
Call origin can be enabled by passing `CLOG_ORIGIN` enviroment.

This modifies **stacktrace** much deeper globally!
I haven't found the way detecting caller
without extended stacktrace.
```json
// launch.json
"env": {
    ...
    "CLOG_ORIGIN": "true"
}
```

And for typescript, It uses external sourcemap file
to get infomation of `.ts`,
so needs to export sourceMap as `.map` file.
```json
// tsconfig.json
{
    ...
    "sourceMap": true
}
```

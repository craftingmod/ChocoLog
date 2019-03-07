
export type HlTheme = PropertyNames<Serializify<HlThemeKeys>>
type HlThemeKeys = [
    "a11y-dark",
    "a11y-light",
    "agate",
    "an-old-hope",
    "androidstudio",
    "arduino-light",
    "arta",
    "ascetic",
    "atelier-cave-dark",
    "atelier-cave-light",
    "atelier-dune-dark",
    "atelier-dune-light",
    "atelier-estuary-dark",
    "atelier-estuary-light",
    "atelier-forest-dark",
    "atelier-forest-light",
    "atelier-heath-dark",
    "atelier-heath-light",
    "atelier-lakeside-dark",
    "atelier-lakeside-light",
    "atelier-plateau-dark",
    "atelier-plateau-light",
    "atelier-savanna-dark",
    "atelier-savanna-light",
    "atelier-seaside-dark",
    "atelier-seaside-light",
    "atelier-sulphurpool-dark",
    "atelier-sulphurpool-light",
    "atom-one-dark-reasonable",
    "atom-one-dark",
    "atom-one-light",
    "brown-paper",
    "codepen-embed",
    "color-brewer",
    "darcula",
    "dark",
    "darkula",
    "default",
    "docco",
    "dracula",
    "far",
    "foundation",
    "github-gist",
    "github",
    "gml",
    "googlecode",
    "grayscale",
    "gruvbox-dark",
    "gruvbox-light",
    "hopscotch",
    "hybrid",
    "idea",
    "ir-black",
    "isbl-editor-dark",
    "isbl-editor-light",
    "kimbie.dark",
    "kimbie.light",
    "lightfair",
    "magula",
    "mono-blue",
    "monokai-sublime",
    "monokai",
    "nord",
    "obsidian",
    "ocean",
    "paraiso-dark",
    "paraiso-light",
    "pojoaque",
    "purebasic",
    "qtcreator_dark",
    "qtcreator_light",
    "railscasts",
    "rainbow",
    "routeros",
    "school-book",
    "shades-of-purple",
    "solarized-dark",
    "solarized-light",
    "sunburst",
    "tomorrow-night-blue",
    "tomorrow-night-bright",
    "tomorrow-night-eighties",
    "tomorrow-night",
    "tomorrow",
    "vs",
    "vs2015",
    "xcode",
    "xt256",
    "zenburn"
]

type PropertyNames<T extends string[]> = {
    // tslint:disable-next-line
    [K in keyof T]: T[K] extends Function ? never :
    T[K] extends string ? T[K] :
    never
}[keyof T]
/**
 * Serializify library
 */
/* tslint:disable */
type Serializable = string | number | boolean | SerializeObject | SerializeArray
interface SerializeObject {
    [x: string]: Serializable;
}
interface SerializeArray extends Array<Serializable> { }
/**
 * Serializify type
 */
// support type
type Diff<T, U> = T extends U ? never : T;  // Remove types from T that are assignable to U
type Filter<T, U> = T extends U ? T : never;  // Remove types from T that are not assignable to U
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
type SerializablePropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : (T[K] extends Serializable ? K : never) }[keyof T];
type SerializableProperties<T> = Pick<T, SerializablePropertyNames<T>>;
// serializify
/**
 * Remove all non-serialize properties
 * 
 * Recursive
 */
type Serializify<T> =
    T extends (infer R)[] ? SerialArray<R> :
    T extends Function ? never :
    T extends object ? SerialObject<T> :
    T extends Serializable ? T :
    never;
type SerialObject<T> = SerializableProperties<{
    [P in keyof T]: Serializify<T[P]>
}>
interface SerialArray<T> extends Array<Serializify<T>> { }
// functional
type Functional<T> = FunctionProperties<T>
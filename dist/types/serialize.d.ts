/**
 * Serializible-Generic
 */
export declare type SerializableGeneric<T> = T extends (infer R)[] ? SerialArrayGeneric<R> : T extends Function ? never : T extends object ? SerialObjectGeneric<T> : T extends Serializable ? T : never;
declare type SerialObjectGeneric<T> = {
    [P in keyof T]: SerializableGeneric<T[P]>;
};
interface SerialArrayGeneric<T> extends Array<SerializableGeneric<T>> {
}
/**
 * Serializable type defintion.
 */
export declare type Serializable = string | number | boolean | SerializeObject | SerializeArray;
export interface SerializeObject {
    [x: string]: Serializable;
}
export interface SerializeArray extends Array<Serializable> {
}
declare type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
declare type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;
declare type SerializablePropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : (T[K] extends Serializable ? K : never);
}[keyof T];
export declare type SerializableProperties<T> = Pick<T, SerializablePropertyNames<T>>;
/**
 * Remove all non-serialize properties
 *
 * Recursive
 */
export declare type Serializify<T> = T extends (infer R)[] ? SerialArray<R> : T extends Function ? never : T extends object ? SerialObject<T> : T extends Serializable ? T : never;
declare type SerialObject<T> = SerializableProperties<{
    [P in keyof T]: Serializify<T[P]>;
}>;
interface SerialArray<T> extends Array<Serializify<T>> {
}
export declare type Functional<T> = FunctionProperties<T>;
export {};

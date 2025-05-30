export namespace Iterable {
  export function is<T = any>(thing: unknown): thing is Iterable<T> {
    // typeof [][Symbol.iterator] === 'function' 传统数组也有这个特征
    return !!thing && typeof thing === 'object' && typeof (thing as Iterable<T>)[Symbol.iterator] === 'function';
  }
}

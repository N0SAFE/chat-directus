import { useState } from "react";

export default function useArray<T>(initialState?: T[] | (() => T[])){
    const [array, setArray] = useState<T[]>(initialState || [])
    
    return [array, {
        push: (...items: T[]) => setArray([...array, ...items]),
        unshift: (...items: T[]) => setArray([...items, ...array]),
        pop: () => setArray(array.slice(0, -1)),
        filter: (callback: (value: T, index: number, array: T[]) => boolean) => setArray(array.filter(callback)),
        map: (callback: (value: T, index: number, array: T[]) => T) => setArray(array.map(callback)),
        sort: (callback: (a: T, b: T) => number) => setArray(array.toSorted(callback)),
        reverse: () => setArray(array.toReversed()),
        clear: () => setArray([]),
        remove: (index: number) => setArray(array.filter((_, i) => i !== index)),
        set: (index: number, value: T) => setArray(array.map((v, i) => i === index ? value : v))
    }, setArray] as const
}


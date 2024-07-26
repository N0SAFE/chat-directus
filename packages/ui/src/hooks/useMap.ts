import { useState } from "react"

export default function useMap<K, V>(initialState?: Map<K, V> | (() => Map<K, V> )){
    const [map, setMap] = useState<Map<K, V>>(initialState || new Map<K, V>)
    const copy = (map: Map<K, V>) => new Map<K, V>(map)
    
    return [map, {
        set: (key: K, v: {value?: V, callback?: ((key: K, value: V | undefined, map: Map<K, V>) => V)}) => {
            let newMap
            setMap((lastMap) => {
                newMap = copy(lastMap).set(key, typeof v.callback === 'function' ? v.callback(key, lastMap.get(key), lastMap)! : v.value! )
                return newMap
            })
            return newMap
        },
        get: (key: K) => map.get(key),
        has: (key: K) => map.has(key),
        delete: (key: K) => {
            let newMap
            setMap((lastMap) => {
                newMap = copy(lastMap)
                newMap.delete(key)
                return newMap
            })
            return newMap
        },
        clear: () => {
            let newMap = new Map<K, V>()
            setMap(newMap)
            return newMap
        },
    }, setMap] as const
}
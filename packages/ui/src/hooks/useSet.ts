import { useState } from "react"

export default function useSet<V>(initialState?: Set<V> | (() => Set<V> )){
    const [set, setSet] = useState<Set<V>>(initialState || new Set<V>)
    const copy = (map: Set<V>) => new Set<V>(map)
    
    return [set, {
        add: (value: V) => {
            const newSet = copy(set).add(value)
            setSet(newSet)
            return newSet
        },
        has: (value: V) => set.has(value),
        delete: (value: V) => {
            const newSet = copy(set)
            newSet.delete(value)
            setSet(newSet)
            return newSet
        },
        clear: () => {
            const newSet = new Set<V>()
            setSet(newSet)
            return newSet
        },
    }, setSet] as const
}
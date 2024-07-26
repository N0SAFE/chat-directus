import React, { useEffect } from 'react'

export default function useScrollTrigger(
    ref: React.RefObject<HTMLElement>,
    options?: {
        threshold: number,
        onChange?: (triggered: boolean) => void
    },
    dependencies?: React.DependencyList
): boolean {
    const [triggered, setTriggered] = React.useState(false)

    React.useEffect(() => {
        if (!ref.current) {
            return
        }
        return onScrollTrigger(ref.current, setTriggered, options) // return the unsubscribe function
    }, [options?.threshold, ref.current])
    
    useEffect(() => {
        if(options?.onChange) {
            options.onChange(triggered)
        }
    }, [triggered, ...dependencies ?? []])

    return triggered
}

export function onScrollTrigger(
    element: HTMLElement,
    onChange: (triggered: boolean) => void,
    options?: {
        threshold: number,
    }
) {
    let boolean = false
    const handleScroll = (e: HTMLElementEventMap['scroll']) => {
        const update = (triggered: boolean, updateFn: (triggered: boolean) => void) => {
            if (triggered === boolean) return
            boolean = triggered
            updateFn(triggered)
        }
        const scrollY = element.scrollTop < 0 ? -element.scrollTop : element.scrollTop
        const maxScrollY = element.scrollHeight - element.clientHeight
        if (!options?.threshold) {
            if (scrollY === 0) {
                update(true, onChange)
                return
            }
            update(false, onChange)
            return
        }
        if (options?.threshold < 0 && scrollY > (maxScrollY - -options?.threshold)) {
            update(true, onChange)
            return
        }
        if (options?.threshold > 0 && scrollY > options?.threshold) {
            update(true, onChange)
            return
        }
        update(false, onChange)
    }

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
}
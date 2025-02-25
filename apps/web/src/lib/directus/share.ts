import { graphql, realtime, rest } from '@repo/directus-sdk'
import { createTypedClient } from '@repo/directus-sdk/client'

export const createDefaultDirectusInstance = (url: string) => {
    return createTypedClient(url)
        .with(
            rest({
                credentials: 'include',
                onRequest: (options) => ({ ...options, cache: 'no-store' }),
            })
        )
        .with(realtime())
        .with(graphql({ credentials: 'include' }))
}

export const directusUrl = (process.env as any).NEXT_PUBLIC_API_URL!

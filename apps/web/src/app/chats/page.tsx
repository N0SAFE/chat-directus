import directus from '@/lib/directus/index'
import { getServerSession } from 'next-auth'
import * as React from 'react'
import { options } from '@/lib/auth/options'
import { DateTime } from 'luxon'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { Collections } from '@repo/directus-sdk/client'
import { readItems } from '@repo/directus-sdk'
import Chats from './Chats'
import { chatPerPage } from './utils'
import Loader from '@repo/ui/components/atomics/atoms/Loader'

function DateFromNow(date: DateTime) {
    const now = DateTime.local()
    const diffWeeks = Math.floor(now.diff(date, 'weeks').weeks)
    const diffDays = Math.floor(now.diff(date, 'days').days)
    const diffHours = Math.floor(now.diff(date, 'hours').hours)
    const diffMinutes = Math.floor(now.diff(date, 'minutes').minutes)
    const diffSeconds = Math.floor(now.diff(date, 'seconds').seconds)
    if (diffWeeks >= 1) {
        return `${diffWeeks}w`
    } else if (diffDays >= 1) {
        return `${diffDays}d`
    } else if (diffHours >= 1) {
        return `${diffHours}h`
    } else if (diffMinutes >= 1) {
        return `${diffMinutes}m`
    } else if (diffSeconds >= 1) {
        return `${diffSeconds}s`
    } else {
        return 'Just now'
    }
}

const ChatsPage: React.FC = async function ChatsPage({
    searchParams,
}: {
    searchParams?: { convId: `${number}` | undefined }
}) {
    const session = await getServerSession(options)

    if (!session?.user) {
        throw new Error('Not Authorized')
    }

    const queryClient = new QueryClient()

    const promises = []
    promises.push(
        queryClient.prefetchQuery({
            queryKey: ['conversations', session?.user.id],
            queryFn: async () => {
                return await directus.request(
                    readItems('conversation', {
                        fields: [
                            '*',
                            {
                                users: [
                                    '*',
                                    {
                                        directus_users_id: ['*'],
                                    },
                                ],
                            },
                            {
                                chats: [
                                    '*',
                                    {
                                        user_created: ['*'],
                                    },
                                ],
                            },
                        ],
                        deep: {
                            users: {
                                _filter: {
                                    directus_users_id: {
                                        _neq: session?.user.id,
                                    },
                                },
                            },
                            chats: {
                                _limit: 1,
                                _sort: '-date_created',
                            },
                        },
                    })
                )
            },
        })
    )
    if (searchParams?.convId) {
        promises.push(
            await queryClient.prefetchQuery({
                queryKey: ['conversation', Number(searchParams?.convId), 1],
                queryFn: async () => {
                    return (
                        await directus.request(
                            readItems('chat', {
                                fields: [
                                    '*',
                                    {
                                        user_created: ['*'],
                                        asset: [
                                            '*',
                                            {
                                                video: ['*'],
                                                image: ['*'],
                                            },
                                        ],
                                    },
                                ],
                                filter: {
                                    conversation: Number(searchParams?.convId)!,
                                },
                                limit: chatPerPage,
                                sort: '-date_created',
                            })
                        )
                    ).toReversed() as Collections.Chat[]
                },
            })
        )
    }

    await Promise.all(promises)

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <React.Suspense
                fallback={
                    <div className="flex h-screen w-screen items-center justify-center">
                        <Loader />
                    </div>
                }
            >
                <Chats />
            </React.Suspense>
        </HydrationBoundary>
    )
}

export default ChatsPage

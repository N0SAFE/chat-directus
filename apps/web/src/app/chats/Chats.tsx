'use client'

import directus from '@/lib/directus/index'
import * as React from 'react'
import {
    getRelation,
    getStringDate,
    useFileUrl,
} from '@repo/directus-sdk/utils'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { DateTime } from 'luxon'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@repo/ui/components/shadcn/avatar'
import { useSession } from 'next-auth/react'
import { keepPreviousData, QueryClient, useQuery } from '@tanstack/react-query'
import { parseAsInteger, useQueryState } from 'nuqs'
import { Collections, Schema } from '@repo/directus-sdk/client'
import {
    createItem,
    deleteFiles,
    Query,
    readItem,
    readItems,
    SubscriptionOptionsEvents,
    SubscriptionOutput,
    uploadFiles,
} from '@repo/directus-sdk'
import { cn } from '@/lib/utils'
import useMap from '@repo/ui/hooks/useMap'
import { chatPerPage, DateFromNow, PlaceholderChat } from './utils'
import { PenIcon, PhoneIcon, VideoIcon } from './Icon'
import Conversation from './Conversation'

const Chats: React.FC = function Chats() {
    const { data: session } = useSession({ required: true })
    const [convId, setConvId] = useQueryState('convId', parseAsInteger)
    const [chatPage, setChatPage] = React.useState(1)
    const getFileUrl = useFileUrl(directus, {
        accessToken: session?.access_token,
    })
    const [eventMap, { set: setEvent, get: getEvent }] = useMap<
        Collections.Chat['id'] | SubscriptionOptionsEvents,
        SubscriptionOutput<
            Schema,
            'chat',
            Query<Schema, Collections.Chat[]> | undefined,
            SubscriptionOptionsEvents
        >[]
    >(
        new Map([
            ['create', []],
            ['update', []],
            ['delete', []],
        ])
    )
    React.useEffect(() => {
        setChatPage(1)
        const queryCLient = new QueryClient()
        queryCLient.invalidateQueries({ queryKey: ['conversation', convId] })
    }, [convId])

    const newlyCreatedChat = React.useMemo(() => {
        return (
            getEvent('create')?.reduce<Collections.Chat[]>((acc, e) => {
                if (e.event === 'create') {
                    return [...acc, ...(e.data.flat(2) as Collections.Chat[])]
                }
                return acc
            }, []) || []
        )
    }, [getEvent('create')])
    const newlyCreatedChatIds = React.useMemo(() => {
        return newlyCreatedChat.map((c) => c.id)
    }, [newlyCreatedChat])

    const { data: conversationList } = useQuery({
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
    const { data: conversation } = useQuery({
        queryKey: ['conversation', convId],
        queryFn: async () => {
            if (!convId) {
                return
            }
            return (await directus.request(
                readItem('conversation', convId, {
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
                    ],
                    deep: {
                        users: {
                            _filter: {
                                directus_users_id: {
                                    _neq: session?.user.id,
                                },
                            },
                        },
                    },
                })
            )) as Collections.Conversation
        },
        enabled: !!convId,
    })
    const { data: chats } = useQuery({
        placeholderData: keepPreviousData,
        queryKey: ['chats', convId, chatPage],
        queryFn: async () => {
            return (
                await directus.request(
                    readItems('chat', {
                        fields: [
                            '*',
                            {
                                user_created: ['*'],
                                attachments: [
                                    '*',
                                    {
                                        file: ['*'],
                                    },
                                ],
                            },
                        ],
                        filter: {
                            ...(newlyCreatedChatIds.length > 0
                                ? {
                                      id: {
                                          _nin: newlyCreatedChatIds || [],
                                      },
                                  }
                                : {}),
                            conversation: { _eq: convId },
                        },
                        limit: chatPage * chatPerPage,
                        sort: '-date_created',
                    })
                )
            ).toReversed() as Collections.Chat[]
        },
        enabled: !!convId,
        refetchOnWindowFocus: false,
    })
    const updatedChats = React.useMemo(() => {
        const array = [
            ...(chats?.map<Collections.Chat>((c) => {
                const eventData = getEvent(c.id)
                    ?.filter((e) => e.event === 'update')
                    ?.at(-1)?.data
                if (!eventData) {
                    return c
                }
                return eventData.find((chat) => {
                    if (Array.isArray(chat)) {
                        return false
                    }
                    return chat.id === c.id
                }) as Collections.Chat
            }) || []),
            ...newlyCreatedChat,
        ]
        return array?.toReversed?.()
    }, [chats, eventMap])

    React.useEffect(() => {
        if (!convId) {
            return
        }
        let isGoodToGo = true
        let ws: Awaited<ReturnType<typeof directus.subscribe>> | undefined
        setTimeout(async () => {
            if (!isGoodToGo) {
                return
            }
            let sub = await directus.subscribe('chat', {
                query: {
                    fields: [
                        '*',
                        // @ts-ignore
                        'user_created.*',
                        // @ts-ignore
                        'attachments.*',
                        // @ts-ignore
                        'attachments.file.*',
                    ],
                    filter: {
                        conversation: convId!,
                    },
                },
            })
            ws = sub
            for await (const data of sub.subscription) {
                const typedData = data as SubscriptionOutput<
                    Schema,
                    'chat',
                    Query<Schema, Collections.Chat[]> | undefined,
                    SubscriptionOptionsEvents | 'init'
                >
                if (typedData.event !== 'init' && typedData.event !== 'error') {
                    const chats = typedData.data.flat(2) as Collections.Chat[]
                    chats.forEach((chat: Collections.Chat) => {
                        setEvent(chat.id, {
                            callback: (key, value) => {
                                value?.push(typedData)
                                return value || [typedData]
                            },
                        })
                    })
                    setEvent(typedData.event, {
                        callback: (key, value) =>
                            value ? [...value, typedData] : [typedData],
                    })
                }
            }
        }, 1000)
        return () => {
            isGoodToGo = false
            ws?.unsubscribe?.()
        }
    }, [convId])

    console.log(conversationList)

    const [value, setValue] = React.useState('')
    // return <pre>{JSON.stringify(conversationList, null, 4)}</pre>

    return (
        <div className="grid size-full grid-cols-[300px_1fr] overflow-hidden rounded-lg border">
            <div className="border-r bg-muted/20 p-3">
                <div className="flex items-center justify-between space-x-4">
                    <div className="text-sm font-medium">Messenger</div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                    >
                        <PenIcon className="h-4 w-4" />
                        <span className="sr-only">New message</span>
                    </Button>
                </div>
                <div className="py-4">
                    <form>
                        <Input placeholder="Search" className="h-8" />
                    </form>
                </div>
                <div className="grid gap-2">
                    {conversationList?.map((conversation) => {
                        const users = getRelation(conversation.users)
                            ?.map((user) => getRelation(user.directus_users_id))
                            .splice(0, 3)
                        console.log(users)
                        const lastChat = conversation.chats?.[0]
                        if (conversation.group) {
                            return (
                                <Button
                                    key={conversation.id}
                                    onClick={() => setConvId(conversation.id)}
                                    variant={'ghost'}
                                    className={cn(
                                        'flex items-center justify-start gap-4 rounded-lg p-2 py-8',
                                        convId === conversation.id
                                            ? 'bg-primary/10'
                                            : 'hover:bg-muted/50'
                                    )}
                                >
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage
                                            src={getFileUrl(conversation.cover)}
                                        />
                                        <AvatarFallback>
                                            {conversation.group_name
                                                ?.split(' ')
                                                .map(
                                                    (word) =>
                                                        word.toUpperCase()[0]
                                                )
                                                .join('')}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="grid justify-start gap-0.5">
                                        <p className="text-start text-sm font-medium leading-none">
                                            {conversation.group_name}
                                        </p>
                                        <p className="text-start text-xs text-muted-foreground">
                                            {lastChat ? (
                                                <>
                                                    {lastChat.text ||
                                                        'attachments'}{' '}
                                                    &middot;{' '}
                                                    {DateFromNow(
                                                        DateTime.fromISO(
                                                            getStringDate(
                                                                lastChat?.date_created!
                                                            )
                                                        )
                                                    )}
                                                </>
                                            ) : null}{' '}
                                        </p>
                                    </div>
                                </Button>
                            )
                        }
                        const user = getRelation(users?.[0])
                        console.log(user)
                        return (
                            <Button
                                key={conversation.id}
                                onClick={() => setConvId(conversation.id)}
                                variant={'ghost'}
                                className={cn(
                                    'flex items-center justify-start gap-4 rounded-lg p-2 py-8',
                                    convId === conversation.id
                                        ? 'bg-primary/10'
                                        : 'hover:bg-muted/50'
                                )}
                            >
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage
                                        src={getFileUrl(user?.avatar)}
                                    />
                                    <AvatarFallback>
                                        {user?.first_name?.toUpperCase()[0]! +
                                            user?.last_name?.toUpperCase()[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid justify-start gap-0.5">
                                    <p className="text-start text-sm font-medium leading-none">
                                        {
                                            getRelation(lastChat?.user_created)
                                                ?.first_name
                                        }{' '}
                                        {
                                            getRelation(lastChat?.user_created)
                                                ?.last_name
                                        }
                                    </p>
                                    <p className="text-start text-xs text-muted-foreground">
                                        {lastChat ? (
                                            <>
                                                {lastChat.text || 'attachments'}{' '}
                                                &middot;{' '}
                                                {DateFromNow(
                                                    DateTime.fromISO(
                                                        getStringDate(
                                                            lastChat?.date_created!
                                                        )
                                                    )
                                                )}
                                            </>
                                        ) : null}{' '}
                                    </p>
                                </div>
                            </Button>
                        )
                    })}
                </div>
            </div>
            <div className="flex flex-col justify-between overflow-hidden">
                <div className="flex items-center border-b p-3">
                    {(() => {
                        const users = getRelation(conversation?.users)
                            ?.map((user) => getRelation(user.directus_users_id))
                            .splice(0, 3)
                        const user = getRelation(users?.[0])
                        return (
                            <div className="flex items-center gap-2">
                                {conversation?.group ? (
                                    <>
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage
                                                src={getFileUrl(
                                                    conversation?.cover
                                                )}
                                            />
                                            <AvatarFallback>
                                                {conversation?.group_name
                                                    ?.split(' ')
                                                    .map(
                                                        (word) =>
                                                            word.toUpperCase()[0]
                                                    )
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="text-sm font-medium leading-none">
                                                {conversation?.group_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Active 2h ago
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage
                                                src={getFileUrl(user?.avatar)}
                                            />
                                            <AvatarFallback>
                                                {user?.first_name?.toUpperCase()[0]! +
                                                    user?.last_name?.toUpperCase()[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="text-sm font-medium leading-none">
                                                {user?.first_name +
                                                    ' ' +
                                                    user?.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Active 2h ago
                                            </p>
                                        </div>
                                    </>
                                )}{' '}
                            </div>
                        )
                    })()}
                    <div className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Call</span>
                            <PhoneIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Video call</span>
                            <VideoIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Conversation
                    chats={updatedChats}
                    getFileUrl={getFileUrl}
                    convId={convId}
                    fetchMore={() => setChatPage((prev) => prev + 1)}
                    session={session}
                    submit={async (text, AttachmenstDetails) => {
                        const list = await Promise.allSettled(
                            AttachmenstDetails?.map(
                                async (attachmentDetails) => {
                                    const formData = new FormData()
                                    formData.append(
                                        'file',
                                        attachmentDetails.attachment
                                    )
                                    const directusFile = await directus.request(
                                        uploadFiles(formData)
                                    )
                                    return {
                                        ...attachmentDetails,
                                        directusFile:
                                            directusFile as Collections.DirectusFile,
                                    }
                                }
                            ) || []
                        )
                        const uploaded = list
                            .filter((result) => result.status === 'fulfilled')
                            .map((result) => result.value)

                        if (
                            list.some((result) => result.status === 'rejected')
                        ) {
                            await directus.request(
                                deleteFiles(
                                    uploaded.map(
                                        ({ directusFile }) => directusFile.id
                                    )
                                )
                            )
                            throw new Error(
                                'Failed to upload attachments. Try again.'
                            )
                        }
                        return directus.request(
                            createItem('chat', {
                                text,
                                conversation: convId,
                                attachments: uploaded?.map(
                                    ({ directusFile, type }) => {
                                        return {
                                            type: type,
                                            file: directusFile.id,
                                        }
                                    }
                                ) as Collections.Attachment[],
                            })
                        ) as Promise<Collections.Chat>
                    }}
                />
            </div>
        </div>
    )
}

export default Chats

import { Button } from '@repo/ui/components/shadcn/button'
import { SendIcon, XIcon } from './Icon'
import { Input } from '@repo/ui/components/shadcn/input'
import ImageOrPlaceholder from '@repo/ui/components/atomics/atoms/ImageOrPlaceholder'
import VideoOrPlaceholder from '@repo/ui/components/atomics/atoms/VideoOrPlaceholder'
import { Label } from '@repo/ui/components/shadcn/label'
import { Plus } from 'lucide-react'
import { RenderChat } from './RenderChat'
import React from 'react'
import { onScrollTrigger } from '@repo/ui/hooks/useScrollTrigger'
import { Collections } from '@repo/directus-sdk/client'
import { getRelation, useFileUrl } from '@repo/directus-sdk/utils'
import { fileTypeFromBlob } from 'file-type'
import { useQuery } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { AttachmentDetails, PlaceholderChat } from './utils'
import { v4 } from 'uuid'

type ConversationProps = {
    session: Session | null
    chats: Collections.Chat[]
    getFileUrl: ReturnType<typeof useFileUrl>
    submit: (value: string, AttachmenstDetails: AttachmentDetails[]) => Promise<unknown>
    fetchMore: () => void
    convId: number | null
}

export default function Conversation({
    session,
    submit,
    fetchMore,
    getFileUrl,
    chats,
    convId,
}: ConversationProps) {
    const [publichChatList, setPublichChatList] = React.useState<
        {
            id: string
            promise: Promise<unknown>
            data: PlaceholderChat
            error: boolean
        }[]
    >([])
    const pushPublichChatList = React.useCallback(
        (promise: Promise<unknown>, data: PlaceholderChat) => {
            const id = v4()
            setPublichChatList((prev) => [
                ...prev,
                { id, promise, data, error: false },
            ])
            promise
                .then(() => {
                    setPublichChatList((prev) =>
                        prev.filter(({ id }) => id !== id)
                    )
                })
                .catch(() => {
                    console.error('Failed to send message')
                    setPublichChatList((prev) =>
                        prev.map((item) =>
                            item.id === id ? { ...item, error: true } : item
                        )
                    )
                })
        },
        []
    )
    const [text, setText] = React.useState('')
    const [attachments, setAttachments] = React.useState<File[]>([])
    const { data: typedAttachments } = useQuery({
        initialData: [],
        queryKey: ['attachments', attachments],
        queryFn: async () => {
            return (await Promise.all(
                attachments?.map(async (file) => {
                    const type = await fileTypeFromBlob(file)
                    return {
                        file: file,
                        type: (type?.mime as string)?.startsWith('image')
                            ? 'image'
                            : (type?.mime as string)?.startsWith('video')
                              ? 'video'
                              : 'file',
                    }
                }) || []
            )) as {
                type: 'image' | 'video' | 'file'
                file: File
            }[]
        },
    })
    const chatBoxRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (!chatBoxRef.current) {
            return
        }
        return onScrollTrigger(
            chatBoxRef.current,
            (triggered) => {
                console.log('triggered', triggered)
                if (triggered) {
                    fetchMore()
                }
            },
            {
                threshold: -600,
            }
        ) // return the unsubscribe function
    }, [convId, chatBoxRef.current])
    
    if(!convId) {
        return <div className="flex flex-col items-center justify-center h-full text-lg text-primary">Select a conversation to start chatting</div>
    }

    return (
        <div className="flex flex-col overflow-hidden">
            <div
                className="flex flex-col-reverse gap-4 overflow-y-auto overflow-x-hidden p-3"
                ref={chatBoxRef}
            >
                {publichChatList
                    .map(({ data: chat, error }) => (
                        <RenderChat
                            isError={error}
                            isNotUploadedYet
                            isOwned
                            chat={chat}
                            getFileUrl={getFileUrl}
                        />
                    ))
                    ?.toReversed?.()}
                {chats?.map((chat) => (
                    <RenderChat
                        isOwned={
                            getRelation(chat.user_created)?.id ===
                            session?.user.id
                        }
                        chat={chat}
                        getFileUrl={getFileUrl}
                    />
                ))}

                {/* <div className="ml-auto flex w-max max-w-[65%] flex-col gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                            Hey hope you&apos;re doing well! We should catch up
                            sometime soon. 🙏
                        </div>
                        <div className="flex w-max max-w-[65%] flex-col gap-2 rounded-full bg-muted px-4 py-2 text-sm">
                            Sure! I&apos;m free this weekend if you want to grab
                            a coffee.
                        </div>
                        <div className="ml-auto flex w-max max-w-[65%] flex-col gap-2 overflow-hidden rounded-xl text-sm">
                            <img
                                src="/placeholder.svg"
                                alt="photo"
                                width={200}
                                height={150}
                                className="object-cover"
                            />
                        </div>
                        <div className="ml-auto flex w-max max-w-[65%] flex-col gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                            Sounds good! Let&apos;s meet at the Starbucks on 5th
                            Ave.
                        </div>
                        <div className="flex w-max max-w-[65%] flex-col gap-2 rounded-full bg-muted px-4 py-2 text-sm">
                            I&apos;ll message you on Saturday.
                        </div> */}
            </div>
            <div className="border-t">
                <form className="flex w-full items-end space-x-2 p-3">
                    <Label
                        htmlFor="attachment"
                        className="hover flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border"
                    >
                        <span className="sr-only">Attach</span>
                        <Plus className="h-4 w-4" />
                    </Label>
                    <Input
                        multiple
                        onChange={(e) => {
                            if (
                                !e?.target?.files ||
                                e.target.files.length === 0
                            ) {
                                return
                            }
                            setAttachments((prev) => [
                                ...prev,
                                ...Array.from(e.target.files!),
                            ])
                        }}
                        type="file"
                        className="hidden"
                        id="attachment"
                    />
                    <div className="flex w-full flex-col gap-2 rounded-md border">
                        {!!typedAttachments.length && (
                            <div className="flex gap-2 overflow-x-auto overflow-y-hidden p-4">
                                {typedAttachments.map(({ file, type }) => {
                                    const url = URL.createObjectURL(file)
                                    if (type === 'file') {
                                        return (
                                            <div className="flex aspect-video h-20 w-auto items-center gap-2">
                                                <XIcon className="h-4 w-4" />
                                                <span className="text-xs">
                                                    {file.name}
                                                </span>
                                            </div>
                                        )
                                    }
                                    if (type === 'video') {
                                        return (
                                            <VideoOrPlaceholder
                                                src={url}
                                                autoPlay
                                                className="aspect-video h-20 w-auto rounded-md object-cover"
                                            />
                                        )
                                    }
                                    return (
                                        <ImageOrPlaceholder
                                            src={url}
                                            alt="photo"
                                            width={200}
                                            height={150}
                                            className="aspect-square h-20 w-auto rounded-md object-cover"
                                        />
                                    )
                                })}
                            </div>
                        )}

                        <Input
                            variant="ghost"
                            id="message"
                            placeholder="Type your message..."
                            className="flex-1"
                            autoComplete="off"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        onClick={async (e) => {
                            e.preventDefault()
                            if (!text && !attachments.length) {
                                return
                            }
                            const AttachmenstDetails = await Promise.all(
                                attachments?.map(async (attachment) => {
                                    const fileTypeResult =
                                        await fileTypeFromBlob(attachment)
                                    const type = (
                                        fileTypeResult?.mime as string
                                    )?.startsWith('image')
                                        ? 'image'
                                        : (
                                                fileTypeResult?.mime as string
                                            )?.startsWith('video')
                                          ? 'video'
                                          : 'file'

                                    return {
                                        attachment,
                                        url: URL.createObjectURL(attachment),
                                        type,
                                        fileTypeResult,
                                    }
                                }) || []
                            )
                            pushPublichChatList(submit(text, AttachmenstDetails), {
                                text,
                                conversation: convId,
                                attachments: AttachmenstDetails?.map(
                                    ({ url, type }) => ({
                                        type,
                                        file: url,
                                    })
                                ) as PlaceholderChat['attachments'],
                            })
                            setText('')
                            setAttachments([])
                        }}
                    >
                        <span className="sr-only">Send</span>
                        <SendIcon className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}

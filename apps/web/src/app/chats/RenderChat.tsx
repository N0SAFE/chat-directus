import ImageOrPlaceholder from "@repo/ui/components/atomics/atoms/ImageOrPlaceholder"
import { PlaceholderChat } from "./utils"
import { getRelation, useFileUrl } from "@repo/directus-sdk/utils"
import VideoOrPlaceholder from "@repo/ui/components/atomics/atoms/VideoOrPlaceholder"
import { Collections } from "@repo/directus-sdk/client"
import React from "react"
import { cn } from "@/lib/utils"

export type RenderChatProps<P extends boolean> = P extends true
    ? {
          chat: PlaceholderChat
          getFileUrl: ReturnType<typeof useFileUrl>
          isOwned?: boolean
          isNotUploadedYet?: P
          isError?: boolean
      }
    : {
          chat: Collections.Chat
          getFileUrl: ReturnType<typeof useFileUrl>
          isOwned?: boolean
          isNotUploadedYet?: P
          isError?: boolean
      }

export function RenderChat<P extends boolean>({
    chat,
    getFileUrl,
    isOwned,
    isNotUploadedYet,
    isError,
}: RenderChatProps<P>) {
    const attachments = React.useMemo(() => {
        return (
            chat.attachments?.map((attachment) => getRelation(attachment)) || []
        )
    }, [chat.attachments])
    return (
        <div
            className={cn(
                'flex w-max max-w-[65%] flex-col gap-2 rounded-xl px-4 py-2 text-sm text-primary-foreground',
                isOwned
                    ? isNotUploadedYet
                        ? isError
                            ? 'ml-auto bg-red-600/60 text-primary-foreground/60'
                            : 'ml-auto bg-primary/60 text-primary-foreground/60'
                        : 'ml-auto bg-primary'
                    : 'bg-muted text-white'
            )}
        >
            {!!attachments.length && (
                <div className="flex flex-col gap-2">
                    {chat.attachments?.map((attachment) =>
                        getRelation(attachment)?.type === 'image' ? (
                            <ImageOrPlaceholder
                                src={
                                    isNotUploadedYet
                                        ? (
                                              attachment as PlaceholderChat['attachments'][number]
                                          ).file
                                        : getFileUrl(
                                              getRelation(attachment)?.file
                                          )
                                }
                                alt="photo"
                                width={600}
                                height={600}
                                className="object-cover w-80"
                            />
                        ) : getRelation(attachment)?.type === 'video' ? (
                            <VideoOrPlaceholder
                                src={
                                    isNotUploadedYet
                                        ? (
                                              attachment as PlaceholderChat['attachments'][number]
                                          ).file
                                        : getFileUrl(
                                              getRelation(attachment)?.file
                                          )
                                }
                                autoPlay
                                className="object-cover w-80"
                            />
                        ) : null
                    )}
                </div>
            )}
            {chat.text}
        </div>
    )
}
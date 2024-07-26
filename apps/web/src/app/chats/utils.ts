import { Collections } from '@repo/directus-sdk/client'
import { FileTypeResult } from 'file-type'
import { DateTime } from 'luxon'

export const chatPerPage = 50

export function DateFromNow(date: DateTime) {
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

export type PlaceholderChat = {
    conversation: Collections.Conversation['id']
    text: string
    attachments: {
        type: 'image' | 'video' | 'file'
        file: string
    }[]
}

export type AttachmentDetails = {
    attachment: File
    url: string
    type: string
    fileTypeResult: FileTypeResult | undefined
}

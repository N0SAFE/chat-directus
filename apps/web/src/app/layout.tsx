import '@repo/ui/globals.css' // ! load the local stylesheets first to allow for overrides of the ui package components
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@repo/ui/lib/utils'
import ThemeProvider from '@repo/ui/components/theme-provider'
import Loader from '@repo/ui/components/atomics/atoms/Loader'
import ReactQueryProviders from '@/utils/providers/ReactQueryProviders'
import { Suspense } from 'react'
import NextAuthProviders from '@/utils/providers/NextAuthProviders/index'
import NextTopLoader from 'nextjs-toploader'

const fontSans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
    title: 'Create Turborepo',
    description: 'Generated by create turbo',
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}): Promise<JSX.Element> {
    return (
        <html lang="en" className="dark">
            <body
                className={cn(
                    fontSans.variable,
                    'h-screen w-screen overflow-auto bg-background font-sans antialiased'
                )}
            >
                <NextAuthProviders>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <NextTopLoader />
                        <ReactQueryProviders>
                            <Suspense
                                fallback={
                                    <div className="flex h-screen w-screen items-center justify-center">
                                        <Loader />
                                    </div>
                                }
                            >
                                {children}
                            </Suspense>
                        </ReactQueryProviders>
                    </ThemeProvider>
                </NextAuthProviders>
            </body>
        </html>
    )
}

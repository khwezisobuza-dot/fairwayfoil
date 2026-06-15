import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { AuthForm } from "~/components/Auth";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Fairway Foil | AI Live-Caddie',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <AuthLoading>
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          <div className="relative">
            <div className="absolute w-4 h-4 bg-lime-400 rounded-full animate-golf-ball shadow-[0_0_15px_rgba(163,230,53,0.8)] z-10" />
            <h1 className="text-5xl font-extrabold italic text-lime-400 animate-pulse">
              FAIRWAY FOIL
            </h1>
          </div>
        </main>
      </AuthLoading>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
      <Authenticated>
        <Outlet />
      </Authenticated>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="bg-black antialiased overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

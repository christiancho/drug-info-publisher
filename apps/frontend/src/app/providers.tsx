'use client'

import { Theme } from '@radix-ui/themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
      {children}
    </Theme>
  )
}
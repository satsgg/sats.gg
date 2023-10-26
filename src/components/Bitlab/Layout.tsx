import { ReactElement, ReactNode } from 'react'

function PartyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default function getPartyLayout(page: ReactElement) {
  return <PartyLayout>{page}</PartyLayout>
}

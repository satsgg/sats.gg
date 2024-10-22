import { Html, Head, Main, NextScript } from 'next/document'
import { ThemeProvider } from '@/components/theme-provider'

export default function Document() {
  return (
    // <Html className="bg-stone-900">
    <Html>
      <Head />
      {/* <body className="bg-stone-900"> */}
      {/* <body className="bg-neutral-900"> */}
      <body>
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange> */}
        <Main />
        {/* </ThemeProvider> */}
        <NextScript />
      </body>
    </Html>
  )
}

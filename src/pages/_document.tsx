import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    // <Html className="bg-stone-900">
    <Html>
      <Head />
      {/* <body className="bg-stone-900"> */}
      {/* <body className="bg-neutral-900"> */}
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

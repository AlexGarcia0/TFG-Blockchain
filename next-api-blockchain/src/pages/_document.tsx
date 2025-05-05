// src/pages/_document.tsx

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Aquí se cargan los archivos CSS globales */}
        <link rel="stylesheet" href="/inicio.css" />
        <link rel="stylesheet" href="/dashboard.css" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

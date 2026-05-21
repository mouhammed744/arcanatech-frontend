/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_OAUTH_GOOGLE_CLIENT_ID?: string
  readonly VITE_OAUTH_MICROSOFT_CLIENT_ID?: string
  readonly VITE_OAUTH_REDIRECT_URI?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '/vite.svg' {
  const src: string
  export default src
}

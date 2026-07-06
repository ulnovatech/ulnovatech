/** Optional runtime dependency — types only for dynamic import when installed. */
declare module 'playwright' {
  export const chromium: {
    launch: (opts: { headless: boolean }) => Promise<{
      newPage: () => Promise<{
        goto: (url: string, opts: { waitUntil: string; timeout: number }) => Promise<void>;
        content: () => Promise<string>;
        close: () => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
  };
}

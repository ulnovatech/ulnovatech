import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'

export const APP_RESUME_EVENT = 'uln-app-resume'

export function useAppResume(onResume) {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return undefined

        let sub
        CapApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                onResume?.()
                window.dispatchEvent(new CustomEvent(APP_RESUME_EVENT))
            }
        }).then((handle) => {
            sub = handle
        })

        return () => {
            sub?.remove()
        }
    }, [onResume])
}

export function useOnAppResume(handler) {
    useEffect(() => {
        window.addEventListener(APP_RESUME_EVENT, handler)
        return () => window.removeEventListener(APP_RESUME_EVENT, handler)
    }, [handler])
}

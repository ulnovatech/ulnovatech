import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getStoredAlertsEnabled,
  getStoredFcmToken,
  registerDeviceToken,
  setStoredFcmToken,
  unregisterDeviceToken,
} from '../services/push'

function navigateFromNotification(navigate, data = {}) {
  const type = data.request_type || data.requestType
  const id = data.source_id || data.sourceId
  if (type && id) {
    navigate(`/inbox/${type}/${id}`)
    return
  }
  navigate('/inbox')
}

export default function PushNotificationManager() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const listenersBound = useRef(false)

  useEffect(() => {
    if (loading || !isAuthenticated || !Capacitor.isNativePlatform()) {
      return
    }

    let cancelled = false

    async function setupPush() {
      const permission = await PushNotifications.checkPermissions()
      let receive = permission.receive

      if (receive === 'prompt' || receive === 'prompt-with-rationale') {
        const requested = await PushNotifications.requestPermissions()
        receive = requested.receive
      }

      if (receive !== 'granted') {
        return
      }

      if (!listenersBound.current) {
        await PushNotifications.addListener('registration', async (token) => {
          const value = token.value
          if (!value) return
          await setStoredFcmToken(value)
          const alertsEnabled = await getStoredAlertsEnabled()
          try {
            await registerDeviceToken(value, { alertsEnabled })
          } catch (err) {
            console.error('Device registration failed', err)
          }
        })

        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error', error)
        })

        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          const title = notification.title || 'New lead'
          const body = notification.body || 'Open inbox to view'
          toast(`${title} — ${body}`, { duration: 5000 })
        })

        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          navigateFromNotification(navigate, action.notification?.data || {})
        })

        listenersBound.current = true
      }

      if (!cancelled) {
        await PushNotifications.register()
      }
    }

    setupPush()

    const resumeSub = CapApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return
      const token = await getStoredFcmToken()
      if (!token) {
        await PushNotifications.register()
        return
      }
      const alertsEnabled = await getStoredAlertsEnabled()
      try {
        await registerDeviceToken(token, { alertsEnabled })
      } catch {
        // ignore transient network errors on resume
      }
    })

    return () => {
      cancelled = true
      resumeSub.then((sub) => sub.remove())
    }
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      ;(async () => {
        const token = await getStoredFcmToken()
        if (token) {
          await unregisterDeviceToken(token)
        }
        await setStoredFcmToken(null)
      })()
    }
  }, [isAuthenticated, loading])

  return null
}

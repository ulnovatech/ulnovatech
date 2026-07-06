import { Preferences } from '@capacitor/preferences'
import { apiFetch } from './api'

export const FCM_TOKEN_KEY = 'uln_fcm_token'
export const PUSH_ALERTS_KEY = 'uln_push_alerts'

export async function getStoredFcmToken() {
  const { value } = await Preferences.get({ key: FCM_TOKEN_KEY })
  return value || null
}

export async function setStoredFcmToken(token) {
  if (!token) {
    await Preferences.remove({ key: FCM_TOKEN_KEY })
    return
  }
  await Preferences.set({ key: FCM_TOKEN_KEY, value: token })
}

export async function getStoredAlertsEnabled() {
  const { value } = await Preferences.get({ key: PUSH_ALERTS_KEY })
  if (value === null || value === undefined || value === '') return true
  return value === '1'
}

export async function setStoredAlertsEnabled(enabled) {
  await Preferences.set({ key: PUSH_ALERTS_KEY, value: enabled ? '1' : '0' })
}

export async function registerDeviceToken(fcmToken, { alertsEnabled = true, platform = 'android' } = {}) {
  return apiFetch('/mobile/devices', {
    method: 'POST',
    body: JSON.stringify({
      fcm_token: fcmToken,
      platform,
      alerts_enabled: alertsEnabled,
    }),
  })
}

export async function fetchDeviceStatus(fcmToken) {
  const params = new URLSearchParams({ fcm_token: fcmToken })
  return apiFetch(`/mobile/devices?${params.toString()}`)
}

export async function updateDeviceAlerts(fcmToken, alertsEnabled) {
  return apiFetch('/mobile/devices', {
    method: 'PATCH',
    body: JSON.stringify({
      fcm_token: fcmToken,
      alerts_enabled: alertsEnabled,
    }),
  })
}

export async function unregisterDeviceToken(fcmToken) {
  if (!fcmToken) return null
  try {
    return await apiFetch('/mobile/devices', {
      method: 'DELETE',
      body: JSON.stringify({ fcm_token: fcmToken }),
    })
  } catch {
    return null
  }
}

export async function syncAlertsPreference(enabled) {
  await setStoredAlertsEnabled(enabled)
  const token = await getStoredFcmToken()
  if (!token) return null
  return updateDeviceAlerts(token, enabled)
}

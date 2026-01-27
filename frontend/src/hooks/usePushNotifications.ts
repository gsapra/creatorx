import { useEffect } from 'react'
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications'
import { platform } from '@/utils/platform'
import toast from 'react-hot-toast'

export function usePushNotifications() {
  useEffect(() => {
    if (!platform.isNative()) return

    const setupPushNotifications = async () => {
      try {
        // Request permission to use push notifications
        const permStatus = await PushNotifications.checkPermissions()

        if (permStatus.receive === 'prompt') {
          const request = await PushNotifications.requestPermissions()

          if (request.receive !== 'granted') {
            console.log('Push notification permission denied')
            return
          }
        }

        if (permStatus.receive === 'denied') {
          console.log('Push notification permission denied')
          return
        }

        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register()

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token:', token.value)

          // TODO: Send token to your backend server
          // This token should be stored in the database and used to send push notifications
          // Example: await api.post('/users/push-token', { token: token.value })
        })

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration:', error)
        })

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('Push notification received:', notification)

            // Show toast notification when app is in foreground
            toast.success(notification.title || 'New notification', {
              duration: 5000,
            })
          }
        )

        // Method called when tapping on a notification
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification: ActionPerformed) => {
            console.log('Push notification action performed:', notification)

            // TODO: Navigate to relevant screen based on notification data
            // Example: if (notification.notification.data.type === 'script_ready') {
            //   navigate('/dashboard/script')
            // }
          }
        )
      } catch (error) {
        console.error('Push notification setup error:', error)
      }
    }

    setupPushNotifications()

    return () => {
      // Clean up listeners
      PushNotifications.removeAllListeners()
    }
  }, [])
}

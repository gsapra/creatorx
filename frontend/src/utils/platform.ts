import { Capacitor } from '@capacitor/core'

export const platform = {
  isNative: () => Capacitor.isNativePlatform(),
  isWeb: () => !Capacitor.isNativePlatform(),
  getPlatform: () => Capacitor.getPlatform(), // 'ios', 'android', or 'web'
  isIOS: () => Capacitor.getPlatform() === 'ios',
  isAndroid: () => Capacitor.getPlatform() === 'android',
}

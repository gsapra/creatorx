import { Share } from '@capacitor/share'
import { platform } from '@/utils/platform'
import toast from 'react-hot-toast'

interface ShareOptions {
  title: string
  text: string
  url?: string
  dialogTitle?: string
}

interface UseShareResult {
  share: (options: ShareOptions) => Promise<boolean>
  canShare: () => boolean
}

export function useShare(): UseShareResult {
  const canShare = (): boolean => {
    // Native platforms always support sharing
    if (platform.isNative()) {
      return true
    }

    // Web: check if Web Share API is available
    return typeof navigator !== 'undefined' && !!navigator.share
  }

  const share = async (options: ShareOptions): Promise<boolean> => {
    const { title, text, url, dialogTitle } = options

    try {
      if (platform.isNative()) {
        // Use native sharing
        await Share.share({
          title,
          text,
          url,
          dialogTitle: dialogTitle || 'Share via',
        })

        return true
      } else if (canShare()) {
        // Use Web Share API
        await navigator.share({
          title,
          text,
          url,
        })

        return true
      } else {
        // Fallback: copy to clipboard
        const shareText = `${title}\n\n${text}${url ? `\n\n${url}` : ''}`

        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText)
          toast.success('Content copied to clipboard!')
          return true
        } else {
          // Legacy fallback
          const textArea = document.createElement('textarea')
          textArea.value = shareText
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          document.body.appendChild(textArea)
          textArea.select()

          try {
            document.execCommand('copy')
            document.body.removeChild(textArea)
            toast.success('Content copied to clipboard!')
            return true
          } catch (err) {
            document.body.removeChild(textArea)
            toast.error('Failed to copy to clipboard')
            return false
          }
        }
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error?.message && !error.message.includes('cancelled')) {
        console.error('Share error:', error)
        toast.error('Failed to share content')
      }
      return false
    }
  }

  return {
    share,
    canShare,
  }
}

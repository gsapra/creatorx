import { useState } from 'react'
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { platform } from '@/utils/platform'
import toast from 'react-hot-toast'

interface UseCameraUploadResult {
  takePhoto: () => Promise<File | null>
  selectFromGallery: () => Promise<File | null>
  isLoading: boolean
}

export function useCameraUpload(): UseCameraUploadResult {
  const [isLoading, setIsLoading] = useState(false)

  const convertPhotoToFile = async (photo: Photo): Promise<File | null> => {
    if (!photo.base64String) {
      return null
    }

    try {
      // Convert base64 to blob
      const response = await fetch(`data:image/${photo.format};base64,${photo.base64String}`)
      const blob = await response.blob()

      // Create file from blob
      const fileName = `photo-${Date.now()}.${photo.format}`
      const file = new File([blob], fileName, { type: `image/${photo.format}` })

      return file
    } catch (error) {
      console.error('Error converting photo to file:', error)
      return null
    }
  }

  const takePhoto = async (): Promise<File | null> => {
    if (!platform.isNative()) {
      // Web fallback - use file input
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment'

        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          resolve(file || null)
        }

        input.oncancel = () => resolve(null)
        input.click()
      })
    }

    setIsLoading(true)

    try {
      // Request camera permission
      const permissions = await Camera.checkPermissions()

      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['camera'] })

        if (request.camera !== 'granted') {
          toast.error('Camera permission is required to take photos')
          setIsLoading(false)
          return null
        }
      }

      // Take photo using native camera
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      })

      const file = await convertPhotoToFile(photo)
      setIsLoading(false)
      return file
    } catch (error: any) {
      console.error('Error taking photo:', error)
      if (error?.message && !error.message.includes('User cancelled')) {
        toast.error('Failed to take photo')
      }
      setIsLoading(false)
      return null
    }
  }

  const selectFromGallery = async (): Promise<File | null> => {
    if (!platform.isNative()) {
      // Web fallback - use file input
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'

        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          resolve(file || null)
        }

        input.oncancel = () => resolve(null)
        input.click()
      })
    }

    setIsLoading(true)

    try {
      // Request photos permission
      const permissions = await Camera.checkPermissions()

      if (permissions.photos !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['photos'] })

        if (request.photos !== 'granted') {
          toast.error('Photo library permission is required')
          setIsLoading(false)
          return null
        }
      }

      // Select photo from gallery
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      })

      const file = await convertPhotoToFile(photo)
      setIsLoading(false)
      return file
    } catch (error: any) {
      console.error('Error selecting from gallery:', error)
      if (error?.message && !error.message.includes('User cancelled')) {
        toast.error('Failed to select photo')
      }
      setIsLoading(false)
      return null
    }
  }

  return {
    takePhoto,
    selectFromGallery,
    isLoading,
  }
}

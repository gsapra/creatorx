import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Eye, Sparkles, Trash2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUrl } from '../config'

interface UploadedImage {
  id: string
  filename: string
  url: string
  base64_data: string
  width: number
  height: number
  size: number
  isReference: boolean // true = reference for AI, false = use in thumbnail
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void
  maxImages?: number
}

export default function ImageUploader({ onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login to upload images')
        return
      }

      const response = await fetch(apiUrl('/api/v1/images/upload-multiple'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      const newImages: UploadedImage[] = data.results
        .filter((r: any) => r.success)
        .map((r: any) => ({
          id: r.image_id,
          filename: r.original_filename || r.filename,
          url: apiUrl(r.url),
          base64_data: r.base64_data,
          width: r.width,
          height: r.height,
          size: r.size,
          isReference: false // Default to using in thumbnail
        }))

      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange(updatedImages)

      toast.success(`${newImages.length} image(s) uploaded!`)

      if (data.failed > 0) {
        toast.error(`${data.failed} image(s) failed to upload`)
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [images, maxImages])

  const toggleImageType = (imageId: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, isReference: !img.isReference } : img
    )
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const deleteImage = async (imageId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(apiUrl(`/api/v1/images/delete/${imageId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }

      const updatedImages = images.filter(img => img.id !== imageId)
      setImages(updatedImages)
      onImagesChange(updatedImages)
      toast.success('Image deleted')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete image')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="text-center">
          <Upload className={`mx-auto w-12 h-12 mb-3 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />

          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">
              Drag & drop images here, or{' '}
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
              disabled={uploading}
            >
              browse
            </button>
          </div>

          <p className="text-xs text-gray-500">
            {uploading ? 'Uploading...' : `PNG, JPG, WebP up to 10MB (max ${maxImages} images)`}
          </p>
        </div>
      </div>

      {/* Image List */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-700">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Use in thumbnail</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">AI Reference</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group rounded-lg border-2 overflow-hidden transition-all ${
                  image.isReference
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-green-400 bg-green-50'
                }`}
              >
                {/* Image Preview */}
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={image.base64_data}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                    <button
                      onClick={() => toggleImageType(image.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
                      title={image.isReference ? "Use in thumbnail" : "Use as reference"}
                    >
                      {image.isReference ? (
                        <Eye className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-green-600" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteImage(image.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-lg shadow-lg hover:bg-red-50"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  {/* Type Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    image.isReference
                      ? 'bg-purple-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {image.isReference ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Reference
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Use
                      </>
                    )}
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-700 truncate" title={image.filename}>
                    {image.filename}
                  </div>
                  <div className="text-xs text-gray-500">
                    {image.width} × {image.height} • {formatFileSize(image.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs space-y-1">
              <p className="font-semibold text-blue-900">📸 How to use images:</p>
              <p className="text-blue-800">
                <span className="font-medium">• Green (Use):</span> Image will be used directly in thumbnail (as background or element)
              </p>
              <p className="text-blue-800">
                <span className="font-medium">• Purple (Reference):</span> AI will analyze style, colors, and composition as inspiration
              </p>
              <p className="text-blue-700 mt-2">
                💡 Tip: Upload your face photo and set as "Use" for personalized thumbnails!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

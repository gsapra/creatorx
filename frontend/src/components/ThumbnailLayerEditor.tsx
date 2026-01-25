import { useState, useRef, useEffect } from 'react'
import { Type, Image as ImageIcon, Square, Circle, Download, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface Layer {
  id: string
  type: 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  zIndex?: number
  // Text properties
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  textDecoration?: string
  letterSpacing?: number
  lineHeight?: number
  color?: string
  strokeColor?: string
  strokeWidth?: number
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  // Image properties
  imageData?: string
  imageOpacity?: number
  // Shape properties
  shapeType?: 'rectangle' | 'circle'
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
}

interface ThumbnailLayerEditorProps {
  baseImageUrl: string
  onExport?: (blob: Blob) => void
  uploadedLayers?: Array<{
    id: string
    url?: string
    base64_data: string
    width: number
    height: number
  }>
}

export default function ThumbnailLayerEditor({ baseImageUrl, onExport, uploadedLayers }: ThumbnailLayerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedLayersAdded, setUploadedLayersAdded] = useState(false)

  // Available fonts
  const FONTS = [
    'Arial',
    'Helvetica',
    'Impact',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Palatino',
    'Garamond',
    'Bookman',
    'Tahoma',
    'Lucida Console'
  ]

  // Load base image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setBaseImage(img)
    }
    img.src = baseImageUrl
  }, [baseImageUrl])

  // Automatically add uploaded images as layers
  useEffect(() => {
    if (!uploadedLayers || uploadedLayers.length === 0 || uploadedLayersAdded) return

    console.log('[Layer Editor] Auto-adding uploaded layers:', uploadedLayers.length)

    const newLayers: Layer[] = uploadedLayers.map((uploadedImg, index) => {
      // Calculate intelligent positioning
      // Center the image with some offset based on index
      const scaleFactor = 0.4 // Scale down to 40% of original size
      const scaledWidth = uploadedImg.width * scaleFactor
      const scaledHeight = uploadedImg.height * scaleFactor

      // Position in center or offset slightly for multiple images
      const baseX = (1792 - scaledWidth) / 2
      const baseY = (1024 - scaledHeight) / 2
      const offsetX = index * 50 // Slight offset for multiple images
      const offsetY = index * 50

      return {
        id: `uploaded_${uploadedImg.id}_${Date.now()}`,
        type: 'image',
        x: baseX + offsetX,
        y: baseY + offsetY,
        width: scaledWidth,
        height: scaledHeight,
        imageData: uploadedImg.base64_data,
        opacity: 1,
        rotation: 0,
        zIndex: 100 + index // High z-index to be on top
      }
    })

    setLayers(prev => [...prev, ...newLayers])
    setUploadedLayersAdded(true)

    // Select the first uploaded layer
    if (newLayers.length > 0) {
      setSelectedLayer(newLayers[0].id)
    }

    toast.success(`✨ Added ${uploadedLayers.length} uploaded image(s) as layers. Drag to reposition!`)
  }, [uploadedLayers, uploadedLayersAdded])

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current || !baseImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match base image
    canvas.width = 1792
    canvas.height = 1024

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw base image
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height)

    // Sort layers by zIndex
    const sortedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

    // Draw layers
    sortedLayers.forEach(layer => {
      ctx.save()

      // Apply opacity
      ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1

      // Apply rotation
      if (layer.rotation) {
        const centerX = layer.x + layer.width / 2
        const centerY = layer.y + layer.height / 2
        ctx.translate(centerX, centerY)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }

      if (layer.type === 'text' && layer.text) {
        // Build font string
        const fontStyle = layer.fontStyle || ''
        const fontWeight = layer.fontWeight || 'bold'
        const fontSize = layer.fontSize || 60
        const fontFamily = layer.fontFamily || 'Arial'
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

        // Text alignment
        ctx.textAlign = layer.textAlign || 'left'

        // Text baseline
        ctx.textBaseline = 'top'

        // Letter spacing (approximate with manual spacing)
        // const letterSpacing = layer.letterSpacing || 0

        // Shadow
        if (layer.shadowColor) {
          ctx.shadowColor = layer.shadowColor
          ctx.shadowBlur = layer.shadowBlur || 0
          ctx.shadowOffsetX = layer.shadowOffsetX || 0
          ctx.shadowOffsetY = layer.shadowOffsetY || 0
        }

        // Calculate x based on alignment
        let textX = layer.x
        if (layer.textAlign === 'center') {
          // const metrics = ctx.measureText(layer.text)
          textX = layer.x + layer.width / 2
        } else if (layer.textAlign === 'right') {
          textX = layer.x + layer.width
        }

        // Draw stroke first
        if (layer.strokeColor && layer.strokeWidth) {
          ctx.strokeStyle = layer.strokeColor
          ctx.lineWidth = layer.strokeWidth
          ctx.strokeText(layer.text, textX, layer.y)
        }

        // Draw fill text
        ctx.fillStyle = layer.color || '#FFFFFF'
        ctx.fillText(layer.text, textX, layer.y)

        // Reset shadow
        ctx.shadowColor = 'transparent'

        // Draw selection box if selected
        if (selectedLayer === layer.id) {
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.strokeRect(layer.x - 5, layer.y - 5, layer.width + 10, layer.height + 10)
          ctx.setLineDash([])
        }
      } else if (layer.type === 'image' && layer.imageData) {
        // Draw image layer
        const img = new Image()
        img.src = layer.imageData
        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)

        // Draw selection box if selected
        if (selectedLayer === layer.id) {
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.strokeRect(layer.x - 5, layer.y - 5, layer.width + 10, layer.height + 10)
          ctx.setLineDash([])
        }
      } else if (layer.type === 'shape') {
        // Draw shape
        if (layer.shapeType === 'rectangle') {
          if (layer.borderRadius) {
            // Rounded rectangle
            const radius = layer.borderRadius
            ctx.beginPath()
            ctx.moveTo(layer.x + radius, layer.y)
            ctx.lineTo(layer.x + layer.width - radius, layer.y)
            ctx.quadraticCurveTo(layer.x + layer.width, layer.y, layer.x + layer.width, layer.y + radius)
            ctx.lineTo(layer.x + layer.width, layer.y + layer.height - radius)
            ctx.quadraticCurveTo(layer.x + layer.width, layer.y + layer.height, layer.x + layer.width - radius, layer.y + layer.height)
            ctx.lineTo(layer.x + radius, layer.y + layer.height)
            ctx.quadraticCurveTo(layer.x, layer.y + layer.height, layer.x, layer.y + layer.height - radius)
            ctx.lineTo(layer.x, layer.y + radius)
            ctx.quadraticCurveTo(layer.x, layer.y, layer.x + radius, layer.y)
            ctx.closePath()

            if (layer.fillColor) {
              ctx.fillStyle = layer.fillColor
              ctx.fill()
            }
            if (layer.borderColor && layer.borderWidth) {
              ctx.strokeStyle = layer.borderColor
              ctx.lineWidth = layer.borderWidth
              ctx.stroke()
            }
          } else {
            // Regular rectangle
            if (layer.fillColor) {
              ctx.fillStyle = layer.fillColor
              ctx.fillRect(layer.x, layer.y, layer.width, layer.height)
            }
            if (layer.borderColor && layer.borderWidth) {
              ctx.strokeStyle = layer.borderColor
              ctx.lineWidth = layer.borderWidth
              ctx.strokeRect(layer.x, layer.y, layer.width, layer.height)
            }
          }
        } else if (layer.shapeType === 'circle') {
          ctx.beginPath()
          const centerX = layer.x + layer.width / 2
          const centerY = layer.y + layer.height / 2
          const radius = Math.min(layer.width, layer.height) / 2
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          if (layer.fillColor) {
            ctx.fillStyle = layer.fillColor
            ctx.fill()
          }
          if (layer.borderColor && layer.borderWidth) {
            ctx.strokeStyle = layer.borderColor
            ctx.lineWidth = layer.borderWidth
            ctx.stroke()
          }
        }

        // Draw selection box if selected
        if (selectedLayer === layer.id) {
          ctx.strokeStyle = '#3B82F6'
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.strokeRect(layer.x - 5, layer.y - 5, layer.width + 10, layer.height + 10)
          ctx.setLineDash([])
        }
      }

      ctx.restore()
    })
  }, [baseImage, layers, selectedLayer])

  const addTextLayer = () => {
    const maxZIndex = Math.max(0, ...layers.map(l => l.zIndex || 0))
    const newLayer: Layer = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 100,
      y: 100,
      width: 600,
      height: 100,
      text: 'YOUR TEXT HERE',
      fontSize: 80,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 4,
      opacity: 1,
      rotation: 0,
      zIndex: maxZIndex + 1,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2
    }
    setLayers([...layers, newLayer])
    setSelectedLayer(newLayer.id)
    toast.success('Text layer added')
  }

  const addImageLayer = async (file: File) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const maxZIndex = Math.max(0, ...layers.map(l => l.zIndex || 0))
        const newLayer: Layer = {
          id: `image_${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: 300,
          height: 300,
          imageData: e.target?.result as string,
          opacity: 1,
          rotation: 0,
          zIndex: maxZIndex + 1
        }
        setLayers([...layers, newLayer])
        setSelectedLayer(newLayer.id)
        toast.success('Image layer added')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to add image:', error)
      toast.error('Failed to add image')
    }
  }

  const addShapeLayer = (shapeType: 'rectangle' | 'circle') => {
    const maxZIndex = Math.max(0, ...layers.map(l => l.zIndex || 0))
    const newLayer: Layer = {
      id: `shape_${Date.now()}`,
      type: 'shape',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      shapeType,
      fillColor: 'rgba(255, 0, 0, 0.5)',
      borderColor: '#FFFFFF',
      borderWidth: 4,
      borderRadius: shapeType === 'rectangle' ? 0 : undefined,
      opacity: 1,
      rotation: 0,
      zIndex: maxZIndex + 1
    }
    setLayers([...layers, newLayer])
    setSelectedLayer(newLayer.id)
    toast.success(`${shapeType} added`)
  }

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    ))
  }

  const deleteLayer = (id: string) => {
    setLayers(layers.filter(layer => layer.id !== id))
    if (selectedLayer === id) {
      setSelectedLayer(null)
    }
    toast.success('Layer deleted')
  }

  const duplicateLayer = (id: string) => {
    const layer = layers.find(l => l.id === id)
    if (!layer) return

    const maxZIndex = Math.max(0, ...layers.map(l => l.zIndex || 0))
    const newLayer = {
      ...layer,
      id: `${layer.type}_${Date.now()}`,
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: maxZIndex + 1
    }
    setLayers([...layers, newLayer])
    setSelectedLayer(newLayer.id)
    toast.success('Layer duplicated')
  }

  const moveLayerUp = (id: string) => {
    const index = layers.findIndex(l => l.id === id)
    if (index < layers.length - 1) {
      const newLayers = [...layers]
      ;[newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]]
      // Update zIndex
      newLayers[index].zIndex = index
      newLayers[index + 1].zIndex = index + 1
      setLayers(newLayers)
      toast.success('Layer moved up')
    }
  }

  const moveLayerDown = (id: string) => {
    const index = layers.findIndex(l => l.id === id)
    if (index > 0) {
      const newLayers = [...layers]
      ;[newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]]
      // Update zIndex
      newLayers[index].zIndex = index
      newLayers[index - 1].zIndex = index - 1
      setLayers(newLayers)
      toast.success('Layer moved down')
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Find clicked layer
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]
      if (x >= layer.x && x <= layer.x + layer.width &&
          y >= layer.y && y <= layer.y + layer.height) {
        setSelectedLayer(layer.id)
        setIsDragging(true)
        setDragOffset({ x: x - layer.x, y: y - layer.y })
        return
      }
    }

    setSelectedLayer(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayer) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    updateLayer(selectedLayer, {
      x: x - dragOffset.x,
      y: y - dragOffset.y
    })
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const exportThumbnail = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        // Download
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `thumbnail-edited-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Call callback if provided
        if (onExport) {
          onExport(blob)
        }

        toast.success('Thumbnail exported!')
      }
    }, 'image/png')
  }

  const selectedLayerData = layers.find(l => l.id === selectedLayer)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Add Elements</h3>
          <button
            onClick={exportThumbnail}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Final Thumbnail
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addTextLayer}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
          >
            <Type className="w-4 h-4" />
            Add Text
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
          >
            <ImageIcon className="w-4 h-4" />
            Add Image
          </button>

          <button
            onClick={() => addShapeLayer('rectangle')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
          >
            <Square className="w-4 h-4" />
            Add Rectangle
          </button>

          <button
            onClick={() => addShapeLayer('circle')}
            className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium"
          >
            <Circle className="w-4 h-4" />
            Add Circle
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              addImageLayer(file)
            }
          }}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Canvas */}
        <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-200">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full border-2 border-gray-300 rounded-lg cursor-move"
              style={{ aspectRatio: '16/9' }}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-xs">
              Click and drag layers to move them
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedLayerData ? 'Edit Layer' : 'Select a Layer'}
          </h3>

          {selectedLayerData ? (
            <div className="space-y-4">
              {/* Text Properties */}
              {selectedLayerData.type === 'text' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                    <textarea
                      value={selectedLayerData.text || ''}
                      onChange={(e) => updateLayer(selectedLayerData.id, { text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={selectedLayerData.fontFamily || 'Arial'}
                        onChange={(e) => updateLayer(selectedLayerData.id, { fontFamily: e.target.value })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                      >
                        {FONTS.map(font => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedLayerData.fontSize || 60}
                        onChange={(e) => updateLayer(selectedLayerData.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="10"
                        max="300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
                      <select
                        value={selectedLayerData.fontWeight || 'bold'}
                        onChange={(e) => updateLayer(selectedLayerData.id, { fontWeight: e.target.value })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="900">Black</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
                      <select
                        value={selectedLayerData.fontStyle || 'normal'}
                        onChange={(e) => updateLayer(selectedLayerData.id, { fontStyle: e.target.value })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                      >
                        <option value="normal">Normal</option>
                        <option value="italic">Italic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text Align</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateLayer(selectedLayerData.id, { textAlign: align })}
                          className={`px-2 py-1 text-xs rounded ${
                            selectedLayerData.textAlign === align
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                      <input
                        type="color"
                        value={selectedLayerData.color || '#FFFFFF'}
                        onChange={(e) => updateLayer(selectedLayerData.id, { color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                      <input
                        type="range"
                        value={(selectedLayerData.opacity || 1) * 100}
                        onChange={(e) => updateLayer(selectedLayerData.id, { opacity: parseInt(e.target.value) / 100 })}
                        className="w-full"
                        min="0"
                        max="100"
                      />
                      <div className="text-xs text-gray-500 text-center">{Math.round((selectedLayerData.opacity || 1) * 100)}%</div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Stroke (Outline)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedLayerData.strokeColor || '#000000'}
                          onChange={(e) => updateLayer(selectedLayerData.id, { strokeColor: e.target.value })}
                          className="w-full h-8 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Width</label>
                        <input
                          type="number"
                          value={selectedLayerData.strokeWidth || 4}
                          onChange={(e) => updateLayer(selectedLayerData.id, { strokeWidth: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          min="0"
                          max="30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Shadow</label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Shadow Color</label>
                        <input
                          type="color"
                          value={selectedLayerData.shadowColor?.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/, (_, r, g, b) =>
                            `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
                          ) || '#000000'}
                          onChange={(e) => updateLayer(selectedLayerData.id, { shadowColor: e.target.value + '80' })}
                          className="w-full h-8 border border-gray-300 rounded"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Blur</label>
                          <input
                            type="number"
                            value={selectedLayerData.shadowBlur || 0}
                            onChange={(e) => updateLayer(selectedLayerData.id, { shadowBlur: parseInt(e.target.value) })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                            min="0"
                            max="50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">X</label>
                          <input
                            type="number"
                            value={selectedLayerData.shadowOffsetX || 0}
                            onChange={(e) => updateLayer(selectedLayerData.id, { shadowOffsetX: parseInt(e.target.value) })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                            min="-50"
                            max="50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Y</label>
                          <input
                            type="number"
                            value={selectedLayerData.shadowOffsetY || 0}
                            onChange={(e) => updateLayer(selectedLayerData.id, { shadowOffsetY: parseInt(e.target.value) })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                            min="-50"
                            max="50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rotation</label>
                    <input
                      type="range"
                      value={selectedLayerData.rotation || 0}
                      onChange={(e) => updateLayer(selectedLayerData.id, { rotation: parseInt(e.target.value) })}
                      className="w-full"
                      min="-180"
                      max="180"
                    />
                    <div className="text-xs text-gray-500 text-center">{selectedLayerData.rotation || 0}°</div>
                  </div>
                </>
              )}

              {/* Image Properties */}
              {selectedLayerData.type === 'image' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={selectedLayerData.width}
                        onChange={(e) => updateLayer(selectedLayerData.id, { width: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="50"
                        max="1792"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={selectedLayerData.height}
                        onChange={(e) => updateLayer(selectedLayerData.id, { height: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="50"
                        max="1024"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                    <input
                      type="range"
                      value={(selectedLayerData.opacity || 1) * 100}
                      onChange={(e) => updateLayer(selectedLayerData.id, { opacity: parseInt(e.target.value) / 100 })}
                      className="w-full"
                      min="0"
                      max="100"
                    />
                    <div className="text-xs text-gray-500 text-center">{Math.round((selectedLayerData.opacity || 1) * 100)}%</div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rotation</label>
                    <input
                      type="range"
                      value={selectedLayerData.rotation || 0}
                      onChange={(e) => updateLayer(selectedLayerData.id, { rotation: parseInt(e.target.value) })}
                      className="w-full"
                      min="-180"
                      max="180"
                    />
                    <div className="text-xs text-gray-500 text-center">{selectedLayerData.rotation || 0}°</div>
                  </div>
                </>
              )}

              {/* Shape Properties */}
              {selectedLayerData.type === 'shape' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={selectedLayerData.width}
                        onChange={(e) => updateLayer(selectedLayerData.id, { width: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="10"
                        max="1792"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={selectedLayerData.height}
                        onChange={(e) => updateLayer(selectedLayerData.id, { height: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="10"
                        max="1024"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fill Color</label>
                    <input
                      type="color"
                      value={selectedLayerData.fillColor?.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+).*\)/, (_, r, g, b) =>
                        `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
                      ) || '#FF0000'}
                      onChange={(e) => updateLayer(selectedLayerData.id, { fillColor: e.target.value + '80' })}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Border Color</label>
                      <input
                        type="color"
                        value={selectedLayerData.borderColor || '#FFFFFF'}
                        onChange={(e) => updateLayer(selectedLayerData.id, { borderColor: e.target.value })}
                        className="w-full h-8 border border-gray-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Border Width</label>
                      <input
                        type="number"
                        value={selectedLayerData.borderWidth || 4}
                        onChange={(e) => updateLayer(selectedLayerData.id, { borderWidth: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="0"
                        max="30"
                      />
                    </div>
                  </div>

                  {selectedLayerData.shapeType === 'rectangle' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
                      <input
                        type="number"
                        value={selectedLayerData.borderRadius || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { borderRadius: parseInt(e.target.value) })}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs"
                        min="0"
                        max="100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                    <input
                      type="range"
                      value={(selectedLayerData.opacity || 1) * 100}
                      onChange={(e) => updateLayer(selectedLayerData.id, { opacity: parseInt(e.target.value) / 100 })}
                      className="w-full"
                      min="0"
                      max="100"
                    />
                    <div className="text-xs text-gray-500 text-center">{Math.round((selectedLayerData.opacity || 1) * 100)}%</div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rotation</label>
                    <input
                      type="range"
                      value={selectedLayerData.rotation || 0}
                      onChange={(e) => updateLayer(selectedLayerData.id, { rotation: parseInt(e.target.value) })}
                      className="w-full"
                      min="-180"
                      max="180"
                    />
                    <div className="text-xs text-gray-500 text-center">{selectedLayerData.rotation || 0}°</div>
                  </div>
                </>
              )}

              {/* Layer Controls */}
              <div className="border-t pt-4 space-y-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">Layer Controls</label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => moveLayerUp(selectedLayerData.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                  >
                    <ArrowUp className="w-3 h-3" />
                    Move Up
                  </button>

                  <button
                    onClick={() => moveLayerDown(selectedLayerData.id)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                  >
                    <ArrowDown className="w-3 h-3" />
                    Move Down
                  </button>
                </div>

                <button
                  onClick={() => duplicateLayer(selectedLayerData.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate Layer
                </button>

                <button
                  onClick={() => deleteLayer(selectedLayerData.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Layer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Click on an element in the canvas to edit it, or add a new element using the toolbar above.
            </p>
          )}
        </div>
      </div>

      {/* Layers List */}
      {layers.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Layers ({layers.length})</h3>
          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedLayer === layer.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {layer.type === 'text' && <Type className="w-4 h-4 text-blue-600" />}
                  {layer.type === 'image' && <ImageIcon className="w-4 h-4 text-green-600" />}
                  {layer.type === 'shape' && <Square className="w-4 h-4 text-purple-600" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {layer.type === 'text' && (layer.text || 'Text Layer')}
                      {layer.type === 'image' && 'Image Layer'}
                      {layer.type === 'shape' && `${layer.shapeType} Layer`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Position: ({Math.round(layer.x)}, {Math.round(layer.y)})
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteLayer(layer.id)
                  }}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

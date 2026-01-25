import { useRef, useEffect, useState } from 'react'
import { Download, Type, Image as ImageIcon, Trash2, ChevronUp, ChevronDown, Palette, Move } from 'lucide-react'

interface ThumbnailLayer {
  id: string
  type: 'text' | 'image' | 'shape' | 'background'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  z_index: number

  // Text properties
  text?: string
  font_family?: string
  font_size?: number
  font_weight?: string
  color?: string
  text_align?: string
  stroke_color?: string
  stroke_width?: number
  shadow_color?: string
  shadow_blur?: number
  shadow_offset_x?: number
  shadow_offset_y?: number

  // Shape/Background properties
  fill_color?: string
  border_color?: string
  border_width?: number
  border_radius?: number

  // Image properties
  image_url?: string
  image_data?: string
  fit?: string
}

interface ThumbnailTemplate {
  id: string
  name: string
  description: string
  style: string
  canvas_width: number
  canvas_height: number
  layers: ThumbnailLayer[]
  psychology_notes?: string
  tags?: string[]
}

interface ThumbnailEditorProps {
  template: ThumbnailTemplate
  onUpdate?: (template: ThumbnailTemplate) => void
}

export default function ThumbnailEditor({ template }: ThumbnailEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [layers, setLayers] = useState<ThumbnailLayer[]>(template.layers || [])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showLayerPanel, setShowLayerPanel] = useState(true)

  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  // Render canvas whenever layers change
  useEffect(() => {
    renderCanvas()
  }, [layers])

  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sort layers by z_index
    const sortedLayers = [...layers].sort((a, b) => a.z_index - b.z_index)

    sortedLayers.forEach(layer => {
      if (layer.opacity === 0) return

      ctx.save()
      ctx.globalAlpha = layer.opacity ?? 1

      // Apply rotation if specified
      if (layer.rotation) {
        ctx.translate(layer.x, layer.y)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-layer.x, -layer.y)
      }

      switch (layer.type) {
        case 'background':
        case 'shape':
          renderShape(ctx, layer)
          break
        case 'text':
          renderText(ctx, layer)
          break
        case 'image':
          renderImage(ctx, layer)
          break
      }

      ctx.restore()

      // Highlight selected layer
      if (layer.id === selectedLayerId) {
        ctx.strokeStyle = '#3B82F6'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.strokeRect(
          layer.x - layer.width / 2 - 5,
          layer.y - layer.height / 2 - 5,
          layer.width + 10,
          layer.height + 10
        )
        ctx.setLineDash([])
      }
    })
  }

  const renderShape = (ctx: CanvasRenderingContext2D, layer: ThumbnailLayer) => {
    const x = layer.type === 'background' ? 0 : layer.x - layer.width / 2
    const y = layer.type === 'background' ? 0 : layer.y - layer.height / 2

    // Fill
    if (layer.fill_color) {
      ctx.fillStyle = layer.fill_color
      if (layer.border_radius) {
        roundRect(ctx, x, y, layer.width, layer.height, layer.border_radius)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, layer.width, layer.height)
      }
    }

    // Border
    if (layer.border_color && layer.border_width) {
      ctx.strokeStyle = layer.border_color
      ctx.lineWidth = layer.border_width
      if (layer.border_radius) {
        roundRect(ctx, x, y, layer.width, layer.height, layer.border_radius)
        ctx.stroke()
      } else {
        ctx.strokeRect(x, y, layer.width, layer.height)
      }
    }
  }

  const renderText = (ctx: CanvasRenderingContext2D, layer: ThumbnailLayer) => {
    if (!layer.text) return

    // Set font
    const fontWeight = layer.font_weight || 'normal'
    const fontSize = layer.font_size || 48
    const fontFamily = layer.font_family || 'Arial'
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.textAlign = (layer.text_align as CanvasTextAlign) || 'center'
    ctx.textBaseline = 'middle'

    // Shadow
    if (layer.shadow_color) {
      ctx.shadowColor = layer.shadow_color
      ctx.shadowBlur = layer.shadow_blur || 0
      ctx.shadowOffsetX = layer.shadow_offset_x || 0
      ctx.shadowOffsetY = layer.shadow_offset_y || 0
    }

    // Stroke
    if (layer.stroke_color && layer.stroke_width) {
      ctx.strokeStyle = layer.stroke_color
      ctx.lineWidth = layer.stroke_width
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.strokeText(layer.text, layer.x, layer.y)
    }

    // Fill
    ctx.fillStyle = layer.color || '#FFFFFF'
    ctx.fillText(layer.text, layer.x, layer.y)
  }

  const renderImage = (ctx: CanvasRenderingContext2D, layer: ThumbnailLayer) => {
    // Placeholder for image rendering
    ctx.fillStyle = '#E5E7EB'
    ctx.fillRect(layer.x - layer.width / 2, layer.y - layer.height / 2, layer.width, layer.height)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Image Placeholder', layer.x, layer.y)
  }

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Find clicked layer (reverse order to prioritize top layers)
    const clickedLayer = [...layers]
      .sort((a, b) => b.z_index - a.z_index)
      .find(layer => {
        const left = layer.x - layer.width / 2
        const right = layer.x + layer.width / 2
        const top = layer.y - layer.height / 2
        const bottom = layer.y + layer.height / 2
        return x >= left && x <= right && y >= top && y <= bottom
      })

    if (clickedLayer) {
      setSelectedLayerId(clickedLayer.id)
      setIsDragging(true)
      setDragStart({ x, y })
    } else {
      setSelectedLayerId(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const dx = x - dragStart.x
    const dy = y - dragStart.y

    setLayers(prev =>
      prev.map(layer =>
        layer.id === selectedLayerId
          ? { ...layer, x: layer.x + dx, y: layer.y + dy }
          : layer
      )
    )

    setDragStart({ x, y })
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const updateLayer = (layerId: string, updates: Partial<ThumbnailLayer>) => {
    setLayers(prev => prev.map(layer => (layer.id === layerId ? { ...layer, ...updates } : layer)))
  }

  const deleteLayer = (layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId))
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null)
    }
  }

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === layerId)
      if (index === -1) return prev

      const newLayers = [...prev]
      if (direction === 'up' && index < newLayers.length - 1) {
        ;[newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]]
        newLayers[index].z_index = index
        newLayers[index + 1].z_index = index + 1
      } else if (direction === 'down' && index > 0) {
        ;[newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]]
        newLayers[index].z_index = index
        newLayers[index - 1].z_index = index - 1
      }
      return newLayers
    })
  }

  const exportThumbnail = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `thumbnail-${Date.now()}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
          <button
            onClick={exportThumbnail}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-brand-600 text-white rounded-lg hover:from-blue-700 hover:to-brand-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="max-w-full h-auto border-2 border-gray-300 rounded cursor-move bg-white shadow-lg"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="w-80 bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Layers</h3>
            <button
              onClick={() => setShowLayerPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...layers].sort((a, b) => b.z_index - a.z_index).map(layer => (
              <div
                key={layer.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedLayerId === layer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLayerId(layer.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {layer.type === 'text' && <Type className="w-4 h-4" />}
                    {layer.type === 'image' && <ImageIcon className="w-4 h-4" />}
                    {(layer.type === 'background' || layer.type === 'shape') && (
                      <Palette className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {layer.type === 'text' ? layer.text : layer.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        moveLayer(layer.id, 'up')
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        moveLayer(layer.id, 'down')
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {layer.type !== 'background' && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteLayer(layer.id)
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Layer Properties Editor */}
          {selectedLayer && (
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h4 className="font-semibold text-sm">Layer Properties</h4>

              {selectedLayer.type === 'text' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                    <input
                      type="text"
                      value={selectedLayer.text || ''}
                      onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={selectedLayer.font_size || 48}
                      onChange={e => updateLayer(selectedLayer.id, { font_size: parseInt(e.target.value) })}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedLayer.color || '#FFFFFF'}
                      onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })}
                      className="w-full h-10 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stroke Color</label>
                    <input
                      type="color"
                      value={selectedLayer.stroke_color || '#000000'}
                      onChange={e => updateLayer(selectedLayer.id, { stroke_color: e.target.value })}
                      className="w-full h-10 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stroke Width</label>
                    <input
                      type="number"
                      value={selectedLayer.stroke_width || 3}
                      onChange={e => updateLayer(selectedLayer.id, { stroke_width: parseInt(e.target.value) })}
                      className="input text-sm"
                      min="0"
                      max="20"
                    />
                  </div>
                </>
              )}

              {(selectedLayer.type === 'background' || selectedLayer.type === 'shape') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fill Color</label>
                    <input
                      type="color"
                      value={selectedLayer.fill_color || '#FFFFFF'}
                      onChange={e => updateLayer(selectedLayer.id, { fill_color: e.target.value })}
                      className="w-full h-10 rounded"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedLayer.opacity ?? 1}
                  onChange={e => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!showLayerPanel && (
        <button
          onClick={() => setShowLayerPanel(true)}
          className="fixed right-4 top-32 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
        >
          <Move className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

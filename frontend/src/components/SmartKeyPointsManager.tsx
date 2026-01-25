import React, { useState } from 'react';
import { Plus, X, GripVertical, AlertCircle } from 'lucide-react';

export interface KeyPoint {
  id: string;
  text: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
}

interface SmartKeyPointsManagerProps {
  keyPoints: KeyPoint[];
  onChange: (points: KeyPoint[]) => void;
  topic?: string;
}

const SmartKeyPointsManager: React.FC<SmartKeyPointsManagerProps> = ({
  keyPoints,
  onChange,
  topic
}) => {
  const [newPointText, setNewPointText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const generateId = () => `kp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addKeyPoint = (text: string, priority: KeyPoint['priority'] = 'must-have') => {
    if (!text.trim()) return;

    onChange([
      ...keyPoints,
      { id: generateId(), text: text.trim(), priority }
    ]);
    setNewPointText('');
  };

  const updateKeyPoint = (id: string, updates: Partial<KeyPoint>) => {
    onChange(
      keyPoints.map(point =>
        point.id === id ? { ...point, ...updates } : point
      )
    );
  };

  const removeKeyPoint = (id: string) => {
    onChange(keyPoints.filter(point => point.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...keyPoints];
    const [dragged] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, dragged);

    onChange(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const mustHaveCount = keyPoints.filter(p => p.priority === 'must-have').length;
  const shouldHaveCount = keyPoints.filter(p => p.priority === 'should-have').length;
  const niceToHaveCount = keyPoints.filter(p => p.priority === 'nice-to-have').length;

  const getPriorityColor = (priority: KeyPoint['priority']) => {
    switch (priority) {
      case 'must-have':
        return 'border-red-200 bg-red-50';
      case 'should-have':
        return 'border-yellow-200 bg-yellow-50';
      case 'nice-to-have':
        return 'border-green-200 bg-green-50';
    }
  };

  const getPriorityBadgeColor = (priority: KeyPoint['priority']) => {
    switch (priority) {
      case 'must-have':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'should-have':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'nice-to-have':
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Key Points to Cover
        </label>
        <div className="flex items-center gap-2 text-xs">
          {mustHaveCount > 0 && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              {mustHaveCount} must-have
            </span>
          )}
          {shouldHaveCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
              {shouldHaveCount} should-have
            </span>
          )}
          {niceToHaveCount > 0 && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {niceToHaveCount} nice-to-have
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-2">
        Add specific points you want included in your script. Drag to reorder priority.
      </div>

      {/* Current key points */}
      {keyPoints.length > 0 && (
        <div className="space-y-2">
          {keyPoints.map((point, idx) => (
            <div
              key={point.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-2 p-3 rounded-lg border-2 transition-all ${getPriorityColor(
                point.priority
              )} ${draggedIndex === idx ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="cursor-move text-gray-400 hover:text-gray-600 mt-1">
                <GripVertical size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <input
                  value={point.text}
                  onChange={(e) => updateKeyPoint(point.id, { text: e.target.value })}
                  className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Equipment needed for beginners"
                />
              </div>

              <select
                value={point.priority}
                onChange={(e) =>
                  updateKeyPoint(point.id, { priority: e.target.value as KeyPoint['priority'] })
                }
                className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer ${getPriorityBadgeColor(
                  point.priority
                )}`}
              >
                <option value="must-have">Must Have</option>
                <option value="should-have">Should Have</option>
                <option value="nice-to-have">Nice to Have</option>
              </select>

              <button
                onClick={() => removeKeyPoint(point.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remove key point"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new key point */}
      <div className="flex gap-2">
        <input
          value={newPointText}
          onChange={(e) => setNewPointText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addKeyPoint(newPointText);
            }
          }}
          placeholder="Add a key point (press Enter)"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={() => addKeyPoint(newPointText)}
          disabled={!newPointText.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Helpful tips */}
      {keyPoints.length === 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-700">
              <strong>Tip:</strong> Key points help ensure the AI includes specific information you want covered.
              For example: "Equipment recommendations", "Common mistakes to avoid", "Step-by-step setup process"
            </div>
          </div>
        </div>
      )}

      {keyPoints.length > 8 && (
        <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              <strong>Warning:</strong> {keyPoints.length} key points may be too many to cover naturally in a single script.
              Consider focusing on 3-5 core points for better clarity and flow.
            </div>
          </div>
        </div>
      )}

      {/* Priority explanation */}
      {keyPoints.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-900 space-y-1">
            <div><strong>Priority Guide:</strong></div>
            <div>• <span className="font-medium text-red-700">Must-have</span>: Critical points that MUST be included</div>
            <div>• <span className="font-medium text-yellow-700">Should-have</span>: Important but can be brief</div>
            <div>• <span className="font-medium text-green-700">Nice-to-have</span>: Include if space allows</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartKeyPointsManager;

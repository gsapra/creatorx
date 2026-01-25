import React from 'react';
import { Zap, Brain, Sparkles } from 'lucide-react';

export interface AIModel {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  speed: 'Ultra Fast' | 'Fast' | 'Medium';
  cost: 'Very Low' | 'Low' | 'Medium' | 'High';
  bestFor: string;
}

export const AI_MODELS: AIModel[] = [
  {
    value: 'openai',
    label: 'Studio Quality',
    description: 'Premium quality with creative, natural flow',
    icon: <Sparkles className="w-6 h-6" />,
    speed: 'Fast',
    cost: 'Medium',
    bestFor: 'Creative scripts with engaging hooks'
  },
  {
    value: 'vertex',
    label: 'Smart Balance',
    description: 'Excellent for educational and technical content',
    icon: <Brain className="w-6 h-6" />,
    speed: 'Fast',
    cost: 'Low',
    bestFor: 'Tutorial and educational videos'
  },
  {
    value: 'groq',
    label: 'Lightning Draft',
    description: 'Ultra-fast generation for rapid iteration',
    icon: <Zap className="w-6 h-6" />,
    speed: 'Ultra Fast',
    cost: 'Very Low',
    bestFor: 'Quick drafts and refinements'
  }
];

interface AIModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelValue: string) => void;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({ selectedModel, onSelectModel }) => {
  const getSpeedColor = (speed: AIModel['speed']) => {
    switch (speed) {
      case 'Ultra Fast':
        return 'bg-green-100 text-green-700';
      case 'Fast':
        return 'bg-blue-100 text-blue-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getCostColor = (cost: AIModel['cost']) => {
    switch (cost) {
      case 'Very Low':
        return 'bg-green-100 text-green-700';
      case 'Low':
        return 'bg-blue-100 text-blue-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'High':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">
        Generation Quality
      </label>
      <div className="text-xs text-gray-600 mb-3">
        Choose the best option for your script based on quality, speed, and cost
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AI_MODELS.map(model => (
          <div
            key={model.value}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedModel === model.value
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            onClick={() => onSelectModel(model.value)}
          >
            <div className={`${selectedModel === model.value ? 'text-indigo-600' : 'text-gray-600'} mb-3`}>
              {model.icon}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className={`font-semibold text-sm ${selectedModel === model.value ? 'text-indigo-900' : 'text-gray-900'}`}>
                {model.label}
              </div>
              {selectedModel === model.value && (
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              )}
            </div>

            <div className="text-xs text-gray-600 mb-3 min-h-[32px]">
              {model.description}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSpeedColor(model.speed)}`}>
                {model.speed}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCostColor(model.cost)}`}>
                {model.cost} cost
              </span>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span className="font-medium">Best for:</span> {model.bestFor}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-900">
          <strong>💡 Recommendation:</strong> Use <strong>Studio Quality</strong> for your main script, then use <strong>Lightning Draft</strong> for quick refinements to save time and costs.
        </div>
      </div>
    </div>
  );
};

export default AIModelSelector;

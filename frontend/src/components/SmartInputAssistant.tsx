import React, { useMemo } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { KeyPoint } from './SmartKeyPointsManager';

export interface ScriptFormData {
  topic: string;
  duration: number;
  keyPoints: KeyPoint[];
  targetAudience?: string;
  style?: string;
}

interface Tip {
  type: 'warning' | 'tip' | 'success';
  message: string;
  icon: React.ReactNode;
}

interface SmartInputAssistantProps {
  formData: ScriptFormData;
}

const SmartInputAssistant: React.FC<SmartInputAssistantProps> = ({ formData }) => {
  const tips = useMemo(() => {
    const newTips: Tip[] = [];

    // Topic validation
    if (formData.topic && formData.topic.length < 15) {
      newTips.push({
        type: 'tip',
        message: 'Add more detail to your topic for better accuracy. Example: "How to edit videos" → "How to edit YouTube videos in DaVinci Resolve for beginners"',
        icon: <Info size={16} />
      });
    }

    // Duration validation
    if (formData.duration < 3) {
      newTips.push({
        type: 'warning',
        message: `Scripts under 3 minutes (currently ${formData.duration} min) may feel rushed. Consider 5-8 minutes for tutorial content.`,
        icon: <AlertTriangle size={16} />
      });
    } else if (formData.duration > 20) {
      newTips.push({
        type: 'warning',
        message: `Long scripts (${formData.duration} minutes) require exceptional pacing to maintain viewer retention. Make sure you have enough content to fill this time.`,
        icon: <AlertTriangle size={16} />
      });
    }

    // Key points validation
    const mustHavePoints = formData.keyPoints.filter(p => p.priority === 'must-have');
    if (mustHavePoints.length > 8) {
      newTips.push({
        type: 'warning',
        message: `${mustHavePoints.length} must-have key points may be too many to cover naturally. Focus on 3-5 core points for clarity.`,
        icon: <AlertTriangle size={16} />
      });
    }

    // Estimate word count and speaking time
    const estimatedWords = formData.duration * 150; // 150 words per minute
    const estimatedReadingTime = Math.round(estimatedWords / 150);

    // Success feedback - all inputs look good
    if (
      formData.topic &&
      formData.topic.length >= 15 &&
      formData.duration >= 5 &&
      formData.duration <= 15 &&
      formData.keyPoints.length >= 2 &&
      formData.keyPoints.length <= 5
    ) {
      newTips.push({
        type: 'success',
        message: `✨ Your input looks great! You'll get approximately ${estimatedWords} words (~${estimatedReadingTime} minutes speaking time).`,
        icon: <CheckCircle size={16} />
      });
    }

    // Style-specific tips
    if (formData.style === 'tutorial' && formData.keyPoints.length < 3) {
      newTips.push({
        type: 'tip',
        message: 'Tutorial scripts work best with clear steps as key points. Try adding: "Tools needed", "Step-by-step process", "Common mistakes"',
        icon: <Info size={16} />
      });
    }

    if (formData.style === 'listicle' && formData.keyPoints.length === 0) {
      newTips.push({
        type: 'tip',
        message: 'For list-style videos, add each item as a key point (e.g., "Item 1: ...", "Item 2: ...") to ensure proper structure',
        icon: <Info size={16} />
      });
    }

    // Target audience tip
    if (!formData.targetAudience || formData.targetAudience.length < 5) {
      newTips.push({
        type: 'tip',
        message: 'Specify your target audience (e.g., "beginner video editors", "advanced photographers") for more tailored language and examples',
        icon: <Info size={16} />
      });
    }

    return newTips;
  }, [formData]);

  if (tips.length === 0) return null;

  const getTipStyle = (type: Tip['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 text-yellow-900 border-yellow-200';
      case 'success':
        return 'bg-green-50 text-green-900 border-green-200';
      case 'tip':
        return 'bg-blue-50 text-blue-900 border-blue-200';
    }
  };

  const getTipIconColor = (type: Tip['type']) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'tip':
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {tips.map((tip, idx) => (
        <div
          key={idx}
          className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${getTipStyle(tip.type)}`}
        >
          <div className={`mt-0.5 flex-shrink-0 ${getTipIconColor(tip.type)}`}>
            {tip.icon}
          </div>
          <div className="flex-1">
            {tip.message}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartInputAssistant;

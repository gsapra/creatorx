import React from 'react';
import { FileText, PlayCircle, List, Star, Video, BarChart3 } from 'lucide-react';

export interface ScriptTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  defaultFlow: string;
  exampleTopics: string[];
  suggestedKeyPoints: string[];
  duration: { min: number; max: number };
  tone: string;
  style: string;
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'tutorial',
    name: 'Tutorial/How-To',
    icon: <FileText className="w-8 h-8" />,
    description: 'Step-by-step instructional content',
    defaultFlow: 'Hook → Problem Statement → Solution Overview → Step-by-Step Guide → Common Mistakes → Results → CTA',
    exampleTopics: ['How to edit videos in DaVinci Resolve', 'Complete Guide to SEO for Beginners'],
    suggestedKeyPoints: ['Tools needed', 'Step-by-step process', 'Common mistakes to avoid', 'Best practices'],
    duration: { min: 8, max: 20 },
    tone: 'educational',
    style: 'educational'
  },
  {
    id: 'storytelling',
    name: 'Storytelling/Narrative',
    icon: <PlayCircle className="w-8 h-8" />,
    description: 'Engaging story with emotional arc',
    defaultFlow: 'Hook (Story Teaser) → Setup → Conflict/Challenge → Rising Action → Climax → Resolution → Lesson Learned → CTA',
    exampleTopics: ['How I Built a $10k/Month Business from Scratch', 'My Journey from Broke to YouTube Success'],
    suggestedKeyPoints: ['Initial situation', 'The main challenge', 'What changed everything', 'Key lesson learned'],
    duration: { min: 10, max: 25 },
    tone: 'engaging',
    style: 'storytelling'
  },
  {
    id: 'listicle',
    name: 'List/Countdown',
    icon: <List className="w-8 h-8" />,
    description: 'Numbered list of tips, tools, or items',
    defaultFlow: 'Hook → Intro (Why This List Matters) → Item #5 → Item #4 → Item #3 → Item #2 → Item #1 → Honorable Mentions → Recap → CTA',
    exampleTopics: ['Top 10 Video Editing Software in 2026', '7 Mistakes New YouTubers Make (And How to Avoid Them)'],
    suggestedKeyPoints: [], // Each numbered item becomes a key point
    duration: { min: 5, max: 15 },
    tone: 'engaging',
    style: 'listicle'
  },
  {
    id: 'product-review',
    name: 'Product Review',
    icon: <Star className="w-8 h-8" />,
    description: 'In-depth product evaluation',
    defaultFlow: 'Hook → Unboxing/First Impressions → Features Overview → Performance Testing → Pros & Cons → Comparison to Competitors → Final Verdict → CTA',
    exampleTopics: ['Sony A7IV Review - Is It Worth $2,500?', 'M2 MacBook Pro - 6 Months Later'],
    suggestedKeyPoints: ['Build quality', 'Key features', 'Real-world performance', 'Price comparison', 'Who should buy this'],
    duration: { min: 10, max: 20 },
    tone: 'professional',
    style: 'product-review'
  },
  {
    id: 'vlog',
    name: 'Vlog/Day-in-Life',
    icon: <Video className="w-8 h-8" />,
    description: 'Personal, behind-the-scenes content',
    defaultFlow: 'Hook → Morning Routine → Activity 1 → Transition → Activity 2 → Activity 3 → Evening Wrap-up → Reflection/Takeaways → CTA',
    exampleTopics: ['A Day in My Life as a Content Creator', 'Behind the Scenes of Creating a Viral Video'],
    suggestedKeyPoints: [], // Flexible structure based on day's activities
    duration: { min: 8, max: 15 },
    tone: 'casual',
    style: 'vlog-style'
  },
  {
    id: 'case-study',
    name: 'Case Study/Results',
    icon: <BarChart3 className="w-8 h-8" />,
    description: 'Data-driven analysis with proven results',
    defaultFlow: 'Hook → Background/Context → The Challenge → Strategy Implemented → Results & Data → Analysis (Why It Worked) → Key Takeaways → How to Replicate → CTA',
    exampleTopics: ['How I Gained 100k Subscribers in 90 Days', 'Doubling Revenue with This One Marketing Change'],
    suggestedKeyPoints: ['Starting point (before data)', 'Exact strategy used', 'Specific results achieved', 'Why it worked', 'How others can replicate'],
    duration: { min: 12, max: 20 },
    tone: 'professional',
    style: 'case-study'
  }
];

interface ScriptTemplatesSelectorProps {
  onSelectTemplate: (template: ScriptTemplate) => void;
  onSkip: () => void;
}

const ScriptTemplatesSelector: React.FC<ScriptTemplatesSelectorProps> = ({ onSelectTemplate, onSkip }) => {
  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Choose a Script Template</h3>
          <p className="text-sm text-gray-600 mt-1">
            Start with a proven structure designed for maximum engagement
          </p>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Start from scratch →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCRIPT_TEMPLATES.map(template => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="p-5 border-2 border-gray-200 rounded-lg hover:border-indigo-500 cursor-pointer transition-all group hover:shadow-md"
          >
            <div className="text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
              {template.icon}
            </div>
            <div className="font-semibold text-base text-gray-900 mb-2">{template.name}</div>
            <div className="text-xs text-gray-600 mb-3">{template.description}</div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="bg-gray-100 px-2 py-1 rounded">
                ⏱️ {template.duration.min}-{template.duration.max} min
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                {template.tone}
              </span>
            </div>

            {template.exampleTopics.length > 0 && (
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                <span className="font-medium">Example:</span> {template.exampleTopics[0]}
              </div>
            )}

            <div className="mt-3 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
              Use this template →
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">💡</div>
          <div className="text-sm text-blue-900">
            <strong>Pro Tip:</strong> Templates provide structure, but feel free to customize the flow,
            key points, and style to match your unique voice and content goals.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptTemplatesSelector;

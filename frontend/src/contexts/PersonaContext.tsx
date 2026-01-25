import { createContext, useContext, useState, ReactNode } from 'react'

export interface Persona {
  id: string
  name: string
  type: 'audience' | 'script'
  description?: string
  isPrebuilt?: boolean
  // Audience fields
  age_range?: string
  interests?: string
  pain_points?: string
  goals?: string
  language_level?: string
  preferred_content?: string
  // Script fields
  tone?: string
  style?: string
  pacing?: string
  hook_style?: string
}

// Prebuilt personas that are always available
export const PREBUILT_PERSONAS: Persona[] = [
  {
    id: 'prebuilt-1',
    name: 'Gen Z Tech Enthusiasts',
    type: 'audience',
    description: 'Young, tech-savvy audience interested in cutting-edge technology and digital trends',
    isPrebuilt: true,
    age_range: '18-25',
    interests: 'Technology, Gaming, Social Media, AI, Crypto',
    pain_points: 'Information overload, Finding authentic content, Career uncertainty',
    goals: 'Stay updated with tech trends, Build digital skills, Find career opportunities',
    language_level: 'Intermediate',
    preferred_content: 'Short-form videos, Tutorials, Memes, Quick tips'
  },
  {
    id: 'prebuilt-2',
    name: 'Professional Millennials',
    type: 'audience',
    description: 'Career-focused professionals seeking growth and work-life balance',
    isPrebuilt: true,
    age_range: '28-40',
    interests: 'Career Growth, Productivity, Leadership, Finance, Wellness',
    pain_points: 'Time management, Work-life balance, Career advancement',
    goals: 'Advance in career, Improve productivity, Achieve financial goals',
    language_level: 'Advanced',
    preferred_content: 'Case studies, How-to guides, Podcasts, Long-form content'
  },
  {
    id: 'prebuilt-3',
    name: 'Aspiring Creators',
    type: 'audience',
    description: 'Content creators looking to grow their channels and improve their craft',
    isPrebuilt: true,
    age_range: '20-35',
    interests: 'Content Creation, Video Editing, Monetization, Audience Growth',
    pain_points: 'Algorithm changes, Content ideas, Consistency, Burnout',
    goals: 'Grow audience, Monetize content, Improve content quality',
    language_level: 'Intermediate',
    preferred_content: 'Tutorials, Behind-the-scenes, Tips & tricks, Strategies'
  },
  {
    id: 'prebuilt-4',
    name: 'Educational Explainer',
    type: 'script',
    description: 'Clear, educational style perfect for tutorials and how-to content',
    isPrebuilt: true,
    tone: 'Clear, Patient, Encouraging',
    style: 'Step-by-step explanations, Visual aids, Real-world examples',
    pacing: 'Moderate pace with clear transitions',
    hook_style: 'Problem-solution opening, "Did you know?" facts'
  },
  {
    id: 'prebuilt-5',
    name: 'Energetic Storyteller',
    type: 'script',
    description: 'Dynamic, engaging style with strong narrative flow',
    isPrebuilt: true,
    tone: 'Enthusiastic, Conversational, Charismatic',
    style: 'Story-driven, Emotional connection, Personal anecdotes',
    pacing: 'Fast-paced with dynamic cuts',
    hook_style: 'Bold statements, Cliffhangers, Personal stories'
  },
  {
    id: 'prebuilt-6',
    name: 'Analytical Deep-Dive',
    type: 'script',
    description: 'Thoughtful, research-based style for in-depth content',
    isPrebuilt: true,
    tone: 'Professional, Informative, Authoritative',
    style: 'Data-driven, Detailed analysis, Multiple perspectives',
    pacing: 'Slower, deliberate pace for complex topics',
    hook_style: 'Intriguing questions, Statistics, Controversial statements'
  }
]

interface PersonaContextType {
  personas: Persona[]
  setPersonas: (personas: Persona[]) => void
  getAudiencePersonas: () => Persona[]
  getScriptPersonas: () => Persona[]
  getAllPersonas: () => Persona[]
  getPrebuiltPersonas: () => Persona[]
  getCustomPersonas: () => Persona[]
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined)

const STORAGE_KEY = 'creatorx_personas'

export function PersonaProvider({ children }: { children: ReactNode }) {
  // Load personas from localStorage on mount
  const [personas, setPersonasState] = useState<Persona[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load personas from localStorage:', error)
      return []
    }
  })

  // Save personas to localStorage whenever they change
  const setPersonas = (newPersonas: Persona[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPersonas))
      setPersonasState(newPersonas)
    } catch (error) {
      console.error('Failed to save personas to localStorage:', error)
      setPersonasState(newPersonas)
    }
  }

  // Combine prebuilt and custom personas
  const getAllPersonas = () => [...PREBUILT_PERSONAS, ...personas]
  const getPrebuiltPersonas = () => PREBUILT_PERSONAS
  const getCustomPersonas = () => personas
  const getAudiencePersonas = () => getAllPersonas().filter(p => p.type === 'audience')
  const getScriptPersonas = () => getAllPersonas().filter(p => p.type === 'script')

  return (
    <PersonaContext.Provider value={{
      personas,
      setPersonas,
      getAudiencePersonas,
      getScriptPersonas,
      getAllPersonas,
      getPrebuiltPersonas,
      getCustomPersonas
    }}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersonas() {
  const context = useContext(PersonaContext)
  if (context === undefined) {
    throw new Error('usePersonas must be used within a PersonaProvider')
  }
  return context
}

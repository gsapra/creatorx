import { createContext, useContext, useState, ReactNode } from 'react'

export interface Persona {
  id: string
  name: string
  type: 'audience' | 'script' | 'brand_voice'
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
  // Brand voice fields
  values?: string
  brand_personality?: string
  key_messages?: string
}

interface PersonaContextType {
  personas: Persona[]
  setPersonas: (personas: Persona[]) => void
  getAudiencePersonas: () => Persona[]
  getScriptPersonas: () => Persona[]
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined)

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([
    {
      id: '1',
      name: 'Tech-Savvy Millennials',
      type: 'audience',
      age_range: '25-35',
      interests: 'Technology, Productivity, Career Growth, AI, Startups',
      pain_points: 'Time management, Work-life balance, Information overload',
      goals: 'Career advancement, Learning new skills, Building side projects',
      language_level: 'Intermediate to Advanced',
      preferred_content: 'Tutorials, Case studies, How-to guides'
    },
    {
      id: '2',
      name: 'Engaging & Energetic',
      type: 'script',
      tone: 'Enthusiastic, Conversational, Friendly',
      style: 'Fast-paced, Story-driven, Visual',
      pacing: 'Quick cuts, Dynamic transitions',
      hook_style: 'Question-based, Shock value, Bold statements'
    }
  ])

  const getAudiencePersonas = () => personas.filter(p => p.type === 'audience')
  const getScriptPersonas = () => personas.filter(p => p.type === 'script')

  return (
    <PersonaContext.Provider value={{ personas, setPersonas, getAudiencePersonas, getScriptPersonas }}>
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

import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Users, Plus, Edit, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas, Persona } from '../contexts/PersonaContext'

export default function PersonasPage() {
  const { personas, setPersonas } = usePersonas()
  const [showModal, setShowModal] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    type: 'audience'
  })

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Please enter a persona name')
      return
    }

    if (editingPersona) {
      setPersonas(personas.map(p => p.id === editingPersona.id ? { ...formData, id: editingPersona.id } as Persona : p))
      toast.success('Persona updated!')
    } else {
      const newPersona: Persona = {
        ...formData,
        id: Date.now().toString()
      } as Persona
      setPersonas([...personas, newPersona])
      toast.success('Persona created!')
    }

    setShowModal(false)
    setEditingPersona(null)
    setFormData({ name: '', type: 'audience' })
  }

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona)
    setFormData(persona)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setPersonas(personas.filter(p => p.id !== id))
    toast.success('Persona deleted!')
  }

  const handleCreate = () => {
    setEditingPersona(null)
    setFormData({ name: '', type: 'audience' })
    setShowModal(true)
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Personas</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Persona</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{persona.name}</h3>
                    <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                      {persona.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {persona.type === 'audience' && (
                  <>
                    {persona.age_range && (
                      <div>
                        <span className="font-semibold text-gray-700">Age Range:</span>
                        <p className="text-gray-600">{persona.age_range}</p>
                      </div>
                    )}
                    {persona.interests && (
                      <div>
                        <span className="font-semibold text-gray-700">Interests:</span>
                        <p className="text-gray-600">{persona.interests}</p>
                      </div>
                    )}
                    {persona.pain_points && (
                      <div>
                        <span className="font-semibold text-gray-700">Pain Points:</span>
                        <p className="text-gray-600">{persona.pain_points}</p>
                      </div>
                    )}
                  </>
                )}
                {persona.type === 'script' && (
                  <>
                    {persona.tone && (
                      <div>
                        <span className="font-semibold text-gray-700">Tone:</span>
                        <p className="text-gray-600">{persona.tone}</p>
                      </div>
                    )}
                    {persona.style && (
                      <div>
                        <span className="font-semibold text-gray-700">Style:</span>
                        <p className="text-gray-600">{persona.style}</p>
                      </div>
                    )}
                  </>
                )}
                {persona.type === 'brand_voice' && persona.values && (
                  <div>
                    <span className="font-semibold text-gray-700">Values:</span>
                    <p className="text-gray-600">{persona.values}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(persona)}
                  className="flex-1 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(persona.id)}
                  className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingPersona ? 'Edit Persona' : 'Create New Persona'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Tech-Savvy Millennials"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="input"
                  >
                    <option value="audience">Audience Persona</option>
                    <option value="script">Script Style</option>
                    <option value="brand_voice">Brand Voice</option>
                  </select>
                </div>

                {formData.type === 'audience' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Range
                      </label>
                      <input
                        type="text"
                        value={formData.age_range || ''}
                        onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                        className="input"
                        placeholder="e.g., 25-35"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interests
                      </label>
                      <textarea
                        value={formData.interests || ''}
                        onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="e.g., Technology, Productivity, Career Growth, AI"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pain Points
                      </label>
                      <textarea
                        value={formData.pain_points || ''}
                        onChange={(e) => setFormData({ ...formData, pain_points: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="e.g., Time management, Work-life balance"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Goals & Aspirations
                      </label>
                      <textarea
                        value={formData.goals || ''}
                        onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="e.g., Career advancement, Learning new skills"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language Level
                      </label>
                      <select
                        value={formData.language_level || ''}
                        onChange={(e) => setFormData({ ...formData, language_level: e.target.value })}
                        className="input"
                      >
                        <option value="">Select level...</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Content Types
                      </label>
                      <input
                        type="text"
                        value={formData.preferred_content || ''}
                        onChange={(e) => setFormData({ ...formData, preferred_content: e.target.value })}
                        className="input"
                        placeholder="e.g., Tutorials, Case studies, How-to guides"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'script' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tone
                      </label>
                      <input
                        type="text"
                        value={formData.tone || ''}
                        onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                        className="input"
                        placeholder="e.g., Enthusiastic, Conversational, Friendly"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Style
                      </label>
                      <textarea
                        value={formData.style || ''}
                        onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="e.g., Fast-paced, Story-driven, Visual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pacing & Delivery
                      </label>
                      <input
                        type="text"
                        value={formData.pacing || ''}
                        onChange={(e) => setFormData({ ...formData, pacing: e.target.value })}
                        className="input"
                        placeholder="e.g., Quick cuts, Dynamic transitions"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hook Style
                      </label>
                      <input
                        type="text"
                        value={formData.hook_style || ''}
                        onChange={(e) => setFormData({ ...formData, hook_style: e.target.value })}
                        className="input"
                        placeholder="e.g., Question-based, Shock value, Bold statements"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'brand_voice' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Values
                      </label>
                      <textarea
                        value={formData.values || ''}
                        onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="e.g., Authenticity, Innovation, Customer-First"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Personality
                      </label>
                      <input
                        type="text"
                        value={formData.brand_personality || ''}
                        onChange={(e) => setFormData({ ...formData, brand_personality: e.target.value })}
                        className="input"
                        placeholder="e.g., Professional yet approachable, Fun and quirky"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key Messages
                      </label>
                      <textarea
                        value={formData.key_messages || ''}
                        onChange={(e) => setFormData({ ...formData, key_messages: e.target.value })}
                        className="input min-h-[80px]"
                        placeholder="e.g., Empowering creators, Quality over quantity"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingPersona(null)
                    setFormData({ name: '', type: 'audience' })
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  {editingPersona ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

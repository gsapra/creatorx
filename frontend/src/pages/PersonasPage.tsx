import { useState, useMemo } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Users, Plus, Edit, Trash2, User, Search, MoreVertical, Check, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePersonas, Persona } from '../contexts/PersonaContext'

type PersonaType = 'audience' | 'script'
type TabType = 'all' | 'prebuilt' | 'custom'

export default function PersonasPage() {
  const { getAllPersonas, getPrebuiltPersonas, getCustomPersonas, setPersonas } = usePersonas()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedType, setSelectedType] = useState<PersonaType>('audience')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [viewingPersona, setViewingPersona] = useState<Persona | null>(null)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    type: 'audience',
    description: ''
  })

  // Get personas based on active tab
  const getPersonasByTab = (): Persona[] => {
    switch (activeTab) {
      case 'prebuilt':
        return getPrebuiltPersonas()
      case 'custom':
        return getCustomPersonas()
      default:
        return getAllPersonas()
    }
  }

  // Filter personas by type and search query
  const filteredPersonas = useMemo(() => {
    let personas = getPersonasByTab()

    // Filter by selected type
    personas = personas.filter(p => p.type === selectedType)

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      personas = personas.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    return personas
  }, [selectedType, searchQuery, activeTab, getAllPersonas, getPrebuiltPersonas, getCustomPersonas])

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter a persona name')
      return
    }

    const customPersonas = getCustomPersonas()

    if (editingPersona) {
      const updatedPersonas = customPersonas.map(p =>
        p.id === editingPersona.id ? { ...formData, id: editingPersona.id } as Persona : p
      )
      setPersonas(updatedPersonas)
      toast.success('Persona updated!')
    } else {
      const newPersona: Persona = {
        ...formData,
        id: `custom-${Date.now()}`,
        type: selectedType,
        isPrebuilt: false
      } as Persona
      setPersonas([...customPersonas, newPersona])
      toast.success('Persona created!')
    }

    setShowModal(false)
    setEditingPersona(null)
    setFormData({ name: '', type: selectedType, description: '' })
  }

  const handleEdit = (persona: Persona) => {
    if (persona.isPrebuilt) {
      toast.error('Cannot edit prebuilt personas')
      return
    }
    setEditingPersona(persona)
    setFormData(persona)
    setShowModal(true)
    setActiveMenu(null)
  }

  const handleDelete = (id: string, isPrebuilt?: boolean) => {
    if (isPrebuilt) {
      toast.error('Cannot delete prebuilt personas')
      return
    }
    const customPersonas = getCustomPersonas()
    setPersonas(customPersonas.filter(p => p.id !== id))
    toast.success('Persona deleted!')
    setActiveMenu(null)
  }

  const handleCreate = () => {
    setEditingPersona(null)
    setFormData({ name: '', type: selectedType, description: '' })
    setShowModal(true)
  }

  const handleDuplicate = (persona: Persona) => {
    const customPersonas = getCustomPersonas()
    const newPersona: Persona = {
      ...persona,
      id: `custom-${Date.now()}`,
      name: `${persona.name} (Copy)`,
      isPrebuilt: false
    }
    setPersonas([...customPersonas, newPersona])
    toast.success('Persona duplicated!')
    setActiveMenu(null)
  }

  const handleView = (persona: Persona) => {
    setViewingPersona(persona)
    setActiveMenu(null)
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create Persona</span>
          </button>
        </div>

        {/* Persona Type Selector */}
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200 inline-flex">
          <button
            onClick={() => setSelectedType('audience')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'audience'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {selectedType === 'audience' && <Check className="w-4 h-4" />}
              <span>Audience Persona</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedType('script')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedType === 'script'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {selectedType === 'script' && <Check className="w-4 h-4" />}
              <span>Script Style</span>
            </div>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search personas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors appearance-none bg-white cursor-pointer"
            >
              <option value="all">View All</option>
              <option value="prebuilt">Prebuilt Personas</option>
              <option value="custom">Custom Built Personas</option>
            </select>
          </div>
        </div>

        {/* Personas Grid */}
        {filteredPersonas.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No personas found' : 'No personas yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : `Create your first ${selectedType} persona to get started`
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Create Persona
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonas.map((persona) => (
              <div
                key={persona.id}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg relative group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      persona.type === 'audience'
                        ? 'bg-indigo-100'
                        : 'bg-purple-100'
                    }`}>
                      <User className={`w-6 h-6 ${
                        persona.type === 'audience'
                          ? 'text-indigo-600'
                          : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="font-bold text-gray-900 break-words">{persona.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {persona.isPrebuilt && (
                          <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full font-semibold">
                            Prebuilt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Menu */}
                  <div className="relative flex-shrink-0 ml-2">
                    <button
                      onClick={() => setActiveMenu(activeMenu === persona.id ? null : persona.id)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {activeMenu === persona.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleView(persona)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-700 rounded-t-lg"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        {!persona.isPrebuilt && (
                          <button
                            onClick={() => handleEdit(persona)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(persona)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>
                        {!persona.isPrebuilt && (
                          <button
                            onClick={() => handleDelete(persona.id, persona.isPrebuilt)}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 text-red-600 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {persona.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {persona.description}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {persona.type === 'audience' && persona.age_range && (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      Age: {persona.age_range}
                    </span>
                  )}
                  {persona.type === 'audience' && persona.language_level && (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      {persona.language_level}
                    </span>
                  )}
                  {persona.type === 'script' && persona.tone && (
                    <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full line-clamp-1">
                      {persona.tone.split(',')[0]}
                    </span>
                  )}
                </div>

                {/* View Details Button */}
                <button
                  onClick={() => handleView(persona)}
                  className="w-full py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg font-semibold hover:from-indigo-100 hover:to-purple-100 transition-all border border-indigo-200"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingPersona ? 'Edit Persona' : `Create ${selectedType === 'audience' ? 'Audience' : 'Script'} Persona`}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder={selectedType === 'audience' ? 'e.g., Tech-Savvy Millennials' : 'e.g., Energetic Storyteller'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors min-h-[80px]"
                    placeholder="Brief description of this persona..."
                  />
                </div>

                {selectedType === 'audience' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age Range
                      </label>
                      <input
                        type="text"
                        value={formData.age_range || ''}
                        onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors min-h-[80px]"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors min-h-[80px]"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors min-h-[80px]"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        placeholder="e.g., Tutorials, Case studies, How-to guides"
                      />
                    </div>
                  </>
                )}

                {selectedType === 'script' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tone
                      </label>
                      <input
                        type="text"
                        value={formData.tone || ''}
                        onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors min-h-[80px]"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                        placeholder="e.g., Question-based, Shock value, Bold statements"
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
                    setFormData({ name: '', type: selectedType, description: '' })
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

        {/* View Details Modal */}
        {viewingPersona && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${
                    viewingPersona.type === 'audience'
                      ? 'bg-indigo-100'
                      : 'bg-purple-100'
                  }`}>
                    <User className={`w-8 h-8 ${
                      viewingPersona.type === 'audience'
                        ? 'text-indigo-600'
                        : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{viewingPersona.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        viewingPersona.type === 'audience'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {viewingPersona.type === 'audience' ? 'Audience Persona' : 'Script Style'}
                      </span>
                      {viewingPersona.isPrebuilt && (
                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full font-semibold">
                          Prebuilt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPersona(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Description */}
              {viewingPersona.description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{viewingPersona.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="space-y-4">
                {viewingPersona.type === 'audience' && (
                  <>
                    {viewingPersona.age_range && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Age Range</h3>
                        <p className="text-gray-900">{viewingPersona.age_range}</p>
                      </div>
                    )}
                    {viewingPersona.interests && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Interests</h3>
                        <p className="text-gray-900">{viewingPersona.interests}</p>
                      </div>
                    )}
                    {viewingPersona.pain_points && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Pain Points</h3>
                        <p className="text-gray-900">{viewingPersona.pain_points}</p>
                      </div>
                    )}
                    {viewingPersona.goals && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Goals & Aspirations</h3>
                        <p className="text-gray-900">{viewingPersona.goals}</p>
                      </div>
                    )}
                    {viewingPersona.language_level && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Language Level</h3>
                        <p className="text-gray-900">{viewingPersona.language_level}</p>
                      </div>
                    )}
                    {viewingPersona.preferred_content && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Preferred Content Types</h3>
                        <p className="text-gray-900">{viewingPersona.preferred_content}</p>
                      </div>
                    )}
                  </>
                )}

                {viewingPersona.type === 'script' && (
                  <>
                    {viewingPersona.tone && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Tone</h3>
                        <p className="text-gray-900">{viewingPersona.tone}</p>
                      </div>
                    )}
                    {viewingPersona.style && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Style</h3>
                        <p className="text-gray-900">{viewingPersona.style}</p>
                      </div>
                    )}
                    {viewingPersona.pacing && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Pacing & Delivery</h3>
                        <p className="text-gray-900">{viewingPersona.pacing}</p>
                      </div>
                    )}
                    {viewingPersona.hook_style && (
                      <div className="border-b border-gray-200 pb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Hook Style</h3>
                        <p className="text-gray-900">{viewingPersona.hook_style}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                {!viewingPersona.isPrebuilt && (
                  <button
                    onClick={() => {
                      setEditingPersona(viewingPersona)
                      setFormData(viewingPersona)
                      setViewingPersona(null)
                      setShowModal(true)
                    }}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Persona</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDuplicate(viewingPersona)
                    setViewingPersona(null)
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => setViewingPersona(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </DashboardLayout>
  )
}

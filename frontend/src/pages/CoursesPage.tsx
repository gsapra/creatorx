import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { BookOpen, Play, Clock, CheckCircle, Award } from 'lucide-react'
import toast from 'react-hot-toast'

interface Course {
  id: string
  title: string
  description: string
  instructor: string
  duration: string
  lessons: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  enrolled: boolean
  progress?: number
  category: string
}

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const courses: Course[] = [
    {
      id: '1',
      title: 'YouTube Growth Masterclass',
      description: 'Learn proven strategies to grow your YouTube channel from 0 to 100K subscribers',
      instructor: 'John Creator',
      duration: '6 hours',
      lessons: 24,
      level: 'Beginner',
      enrolled: true,
      progress: 45,
      category: 'YouTube'
    },
    {
      id: '2',
      title: 'Video Editing Fundamentals',
      description: 'Master the art of video editing with industry-standard tools and techniques',
      instructor: 'Sarah Editor',
      duration: '8 hours',
      lessons: 32,
      level: 'Beginner',
      enrolled: true,
      progress: 20,
      category: 'Editing'
    },
    {
      id: '3',
      title: 'Content Strategy & Planning',
      description: 'Create a winning content strategy that resonates with your audience',
      instructor: 'Mike Strategist',
      duration: '5 hours',
      lessons: 18,
      level: 'Intermediate',
      enrolled: false,
      category: 'Strategy'
    },
    {
      id: '4',
      title: 'Thumbnail Design Psychology',
      description: 'Design thumbnails that get clicks using proven psychological principles',
      instructor: 'Emma Designer',
      duration: '4 hours',
      lessons: 15,
      level: 'Intermediate',
      enrolled: false,
      category: 'Design'
    },
    {
      id: '5',
      title: 'Monetization Strategies',
      description: 'Turn your content into a sustainable income stream with multiple revenue sources',
      instructor: 'David Entrepreneur',
      duration: '7 hours',
      lessons: 28,
      level: 'Advanced',
      enrolled: false,
      category: 'Business'
    },
    {
      id: '6',
      title: 'Instagram Growth Hacks',
      description: 'Explosive Instagram growth tactics that actually work in 2026',
      instructor: 'Lisa Influencer',
      duration: '5 hours',
      lessons: 20,
      level: 'Intermediate',
      enrolled: true,
      progress: 75,
      category: 'Instagram'
    }
  ]

  const categories = ['all', 'YouTube', 'Instagram', 'Editing', 'Design', 'Strategy', 'Business']

  const filteredCourses = courses.filter(course => 
    selectedCategory === 'all' || course.category === selectedCategory
  )

  const handleEnroll = (_courseId: string) => {
    toast.success('Successfully enrolled in course!')
  }

  const handleContinue = (_courseId: string) => {
    toast.success('Continuing course...')
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Level Up Your Creator Skills</h2>
          <p className="text-yellow-50">Expert-led courses to help you grow and monetize</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Courses' : category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-yellow-400 transition-all shadow-sm hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                  <p className="text-sm text-gray-700 flex items-center space-x-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span>By {course.instructor}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                  course.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {course.level}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  {course.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Play className="w-4 h-4" />
                  <span>{course.lessons} lessons</span>
                </div>
              </div>

              {course.enrolled && course.progress !== undefined ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700">Progress</span>
                      <span className="font-semibold text-yellow-600">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleContinue(course.id)}
                    className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Continue Learning</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEnroll(course.id)}
                  className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all transform hover:scale-105"
                >
                  Enroll Now
                </button>
              )}

              {course.enrolled && (
                <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Enrolled</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

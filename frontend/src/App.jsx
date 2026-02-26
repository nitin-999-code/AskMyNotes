import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { getSubjects, setUserId, syncUser } from './api/client'
import TopNav from './components/TopNav'
import SubjectSetup from './components/SubjectSetup'
import ChatPanel from './components/ChatPanel'
import StudyPanel from './components/StudyPanel'

export default function App() {
  const { user, isSignedIn } = useUser()
  const [subjects, setSubjects] = useState([])
  const [activeTab, setActiveTab] = useState('setup')
  const [activeSubjectId, setActiveSubjectId] = useState(null)

  // When user signs in — sync to MongoDB and set global userId header
  useEffect(() => {
    if (!isSignedIn || !user) return
    const clerkId = user.id
    const email = user.primaryEmailAddress?.emailAddress || ''
    const name = user.fullName || ''
    const imageUrl = user.imageUrl || ''
    setUserId(clerkId)
    syncUser(clerkId, email, name, imageUrl).catch(() => { })
    refresh()
  }, [isSignedIn, user?.id])

  const refresh = () =>
    getSubjects().then(r => setSubjects(r.data)).catch(() => { })

  return (
    <>
      {/* Animated background blobs */}
      <div className="app-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="app-shell">
        <TopNav
          subjects={subjects}
          activeTab={activeTab}
          activeSubjectId={activeSubjectId}
          onTab={setActiveTab}
          onSubject={id => { setActiveSubjectId(id); setActiveTab('chat') }}
        />

        <main className="main-content">
          {activeTab === 'setup' && (
            <div className="page-transition" key="setup">
              <SubjectSetup subjects={subjects} onRefresh={refresh} />
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="page-transition" key="chat">
              <ChatPanel
                subjects={subjects}
                activeSubjectId={activeSubjectId}
                onSubjectChange={setActiveSubjectId}
              />
            </div>
          )}
          {activeTab === 'study' && (
            <div className="page-transition" key="study">
              <StudyPanel subjects={subjects} activeSubjectId={activeSubjectId} />
            </div>
          )}
        </main>
      </div>
    </>
  )
}

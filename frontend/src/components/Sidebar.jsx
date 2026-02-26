import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export default function Sidebar({ subjects, activeTab, activeSubjectId, onTab, onSubject }) {
  const tabs = [
    { id: 'setup', icon: '◈', label: 'Setup' },
    { id: 'chat', icon: '◉', label: 'Ask Notes' },
    { id: 'study', icon: '◎', label: 'Study Mode' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">✦</span>
        <span className="brand-name">AskMyNotes</span>
      </div>

      <nav className="sidebar-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-item ${activeTab === t.id ? 'nav-active' : ''}`}
            onClick={() => onTab(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {subjects.length > 0 && (
        <div className="sidebar-subjects">
          <p className="section-label">SUBJECTS</p>
          {subjects.map(s => (
            <button
              key={s._id}
              className={`subject-pill ${activeSubjectId === s._id ? 'subject-active' : ''}`}
              onClick={() => { onSubject(s._id); onTab('chat') }}
            >
              <span className="subject-dot">●</span>
              <span className="subject-name">{s.name}</span>
              <span className="subject-meta">{s.noteCount} files</span>
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        {/* Show UserButton when signed in, Sign In button when signed out */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="btn-signin-sidebar">🔑 Sign In</button>
          </SignInButton>
        </SignedOut>
        <span>Powered by Gemini 1.5</span>
      </div>
    </aside>
  )
}

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export default function TopNav({ subjects, activeTab, activeSubjectId, onTab, onSubject }) {
    const tabs = [
        { id: 'setup', icon: '◈', label: 'Setup' },
        { id: 'chat', icon: '◉', label: 'Ask Notes' },
        { id: 'study', icon: '◎', label: 'Study Mode' },
    ]

    return (
        <nav className="topnav">
            {/* Left — Brand */}
            <div className="topnav-brand">
                <div className="brand-mark">✦</div>
                <span className="brand-name">Ask<span>My</span>Notes</span>
            </div>

            {/* Center — Navigation Tabs */}
            <div className="nav-tabs">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`nav-tab ${activeTab === t.id ? 'nav-tab-active' : ''}`}
                        onClick={() => onTab(t.id)}
                    >
                        <span className="nav-tab-icon">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Right — Subject chips + User profile */}
            <div className="topnav-right">
                {subjects.length > 0 && (
                    <div className="subject-chips">
                        {subjects.map(s => (
                            <button
                                key={s._id}
                                className={`subject-chip ${activeSubjectId === s._id ? 'subject-chip-active' : ''}`}
                                onClick={() => onSubject(s._id)}
                            >
                                <span className="chip-dot" />
                                {s.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="user-section">
                    <span className="powered-badge">Gemini 1.5</span>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: { width: 32, height: 32 }
                                }
                            }}
                        />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn-signin">Sign In</button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </div>
        </nav>
    )
}

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { createSubject, uploadFiles, deleteSubject, renameSubject } from '../api/client'

export default function SubjectSetup({ subjects, onRefresh }) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [uploadState, setUploadState] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  // Step 3 — Guard: show sign-in modal if not authenticated
  function requireAuth() {
    if (!isSignedIn) { openSignIn(); return false }
    return true
  }

  async function handleCreate() {
    if (!name.trim() || subjects.length >= 3) return
    if (!requireAuth()) return       // ← auth guard
    setCreating(true)
    try {
      await createSubject(name.trim())
      setName('')
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create subject')
    } finally {
      setCreating(false)
    }
  }

  // Step 4 — Guard upload too
  async function handleUpload(subjectId, files) {
    if (!files.length) return
    if (!requireAuth()) return       // ← auth guard
    setUploadState(p => ({ ...p, [subjectId]: 'uploading' }))
    try {
      await uploadFiles(subjectId, Array.from(files))
      onRefresh()
      setUploadState(p => ({ ...p, [subjectId]: 'done' }))
    } catch (e) {
      alert(e.response?.data?.error || 'Upload failed')
      setUploadState(p => ({ ...p, [subjectId]: 'idle' }))
    }
  }

  async function handleDelete(subjectId, subjectName) {
    if (!requireAuth()) return
    if (!confirm(`Delete "${subjectName}" and all its uploaded notes? This cannot be undone.`)) return
    try {
      await deleteSubject(subjectId)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete subject')
    }
  }

  function startRename(subject) {
    setEditingId(subject._id)
    setEditName(subject.name)
  }

  async function handleRename(subjectId) {
    if (!editName.trim()) return
    try {
      await renameSubject(subjectId, editName.trim())
      setEditingId(null)
      setEditName('')
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to rename subject')
    }
  }

  function cancelRename() {
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Setup Your Subjects</h1>
        <p className="page-sub">
          Create up to 3 subjects and upload your notes (PDF or TXT) to start learning
        </p>
      </div>

      {/* Create new subject */}
      {subjects.length < 3 ? (
        <div className="create-bar">
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Subject name — e.g. Biology, History..."
          />
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
          >
            {creating ? 'Creating...' : '+ Add Subject'}
          </button>
        </div>
      ) : (
        <div className="notice notice-ok" style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
          ✓ All 3 subjects created — you're all set!
        </div>
      )}

      {/* Subject cards — 3 column grid */}
      <div className="subject-grid">
        {subjects.map((s, i) => {
          const state = uploadState[s._id] || 'idle'
          const isEditing = editingId === s._id
          return (
            <div key={s._id} className="card fade-in">
              <div className="card-top">
                <span className="card-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="card-info">
                  {isEditing ? (
                    <div className="rename-bar">
                      <input
                        className="input rename-input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(s._id)
                          if (e.key === 'Escape') cancelRename()
                        }}
                        autoFocus
                      />
                      <button className="btn btn-small btn-save" onClick={() => handleRename(s._id)}>✓</button>
                      <button className="btn btn-small btn-cancel" onClick={cancelRename}>✕</button>
                    </div>
                  ) : (
                    <>
                      <p className="card-title">{s.name}</p>
                      <p className="card-meta">
                        {s.noteCount || 0} file{(s.noteCount || 0) !== 1 ? 's' : ''} uploaded
                      </p>
                    </>
                  )}
                </div>
                <div className="card-actions">
                  {!isEditing && (
                    <button className="btn-icon" onClick={() => startRename(s)} title="Rename">
                      ✏️
                    </button>
                  )}
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => handleDelete(s._id, s.name)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
                {state === 'done' && <span className="badge-ok">✓ Loaded</span>}
              </div>

              {/* File pills */}
              {s.fileNames?.length > 0 && (
                <div className="file-pills">
                  {s.fileNames.map((fname, fi) => (
                    <span key={fi} className="file-pill">
                      <span className="file-pill-icon">📄</span>
                      {fname}
                    </span>
                  ))}
                </div>
              )}

              {/* Upload dropzone */}
              <label className="dropzone">
                {state === 'uploading'
                  ? <><span className="spin">⟳</span> Processing files...</>
                  : <>
                    <span className="drop-icon">↑</span>
                    <span>Drop PDF or TXT files here</span>
                    <span className="drop-sub">Multiple files allowed</span>
                  </>
                }
                <input
                  type="file" multiple accept=".pdf,.txt"
                  style={{ display: 'none' }}
                  onChange={e => handleUpload(s._id, e.target.files)}
                />
              </label>
            </div>
          )
        })}
      </div>

      {subjects.length === 0 && (
        <div className="empty">
          <span className="empty-icon">◈</span>
          <p>Create your first subject above to get started</p>
        </div>
      )}
    </div>
  )
}

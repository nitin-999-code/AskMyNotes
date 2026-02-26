import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { generateStudy } from '../api/client'

export default function StudyPanel({ subjects, activeSubjectId }) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const [selId, setSelId] = useState(activeSubjectId || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Track MCQ answers and SAQ reveals
  const [picked, setPicked] = useState({})    // { qi: 'A' }
  const [answered, setAnswered] = useState({})    // { qi: true }
  const [showSAQ, setShowSAQ] = useState({})    // { si: true }
  const [score, setScore] = useState(0)

  async function handleGenerate() {
    if (!selId) return
    if (!isSignedIn) { openSignIn(); return }  // Step 6 — auth guard
    setLoading(true); setError(''); setData(null)
    setPicked({}); setAnswered({}); setShowSAQ({}); setScore(0)
    try {
      const res = await generateStudy(selId)
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate. Make sure notes are uploaded.')
    } finally {
      setLoading(false)
    }
  }

  function handlePick(qi, letter) {
    if (answered[qi]) return
    const correct = data.mcqs[qi].correct
    setPicked(p => ({ ...p, [qi]: letter }))
    setAnswered(p => ({ ...p, [qi]: true }))
    if (letter === correct) setScore(s => s + 1)
  }

  const totalAnswered = Object.keys(answered).length
  const totalMCQs = data?.mcqs?.length || 5
  const progressPct = totalMCQs > 0 ? (totalAnswered / totalMCQs) * 100 : 0

  return (
    <div className="page">
      <div className="page-header">
        <h1>Study Mode</h1>
        <p className="page-sub">
          Generate questions from your notes — MCQs and short answers
        </p>
      </div>

      {/* Controls */}
      <div className="study-controls">
        <select
          className="select"
          value={selId}
          onChange={e => setSelId(e.target.value)}
        >
          <option value="">Choose a subject...</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!selId || loading}
        >
          {loading ? <><span className="spin">⟳</span> Generating...</> : '✦ Generate Questions'}
        </button>
      </div>

      {error && <div className="notice notice-err" style={{ maxWidth: 600, margin: '0 auto 1.5rem' }}>{error}</div>}

      {/* Progress + Score */}
      {data && totalAnswered > 0 && (
        <>
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="progress-label">{totalAnswered}/{totalMCQs}</span>
          </div>

          <div className="score-display fade-in">
            <div className="score-number">{score}</div>
            <div className="score-label">
              correct out of {totalAnswered} answered
              {totalAnswered === totalMCQs && (
                <span className="score-final"> — Final Score!</span>
              )}
            </div>
          </div>
        </>
      )}

      {data && (
        <div style={{ maxWidth: 750, margin: '0 auto' }}>
          {/* MCQs */}
          <h2 className="section-title">
            Multiple Choice
            <span className="title-note">({totalMCQs} questions)</span>
          </h2>

          {data.mcqs.map((mcq, qi) => (
            <div key={qi} className="study-card fade-in" style={{ animationDelay: `${qi * 0.05}s` }}>
              <p className="q-num">Q{qi + 1}</p>
              <p className="q-text">{mcq.question}</p>

              <div className="options">
                {mcq.options.map(opt => {
                  const letter = opt.charAt(0)
                  const isCorrect = letter === mcq.correct
                  const isSelected = picked[qi] === letter
                  const show = answered[qi]

                  let cls = 'option'
                  if (show && isCorrect) cls += ' opt-correct'
                  else if (show && isSelected) cls += ' opt-wrong'
                  else if (!show) cls += ' opt-hover'

                  return (
                    <button key={opt} className={cls} onClick={() => handlePick(qi, letter)}>
                      {opt}
                    </button>
                  )
                })}
              </div>

              {answered[qi] && (
                <div className={`explain ${picked[qi] === mcq.correct ? 'explain-ok' : 'explain-no'}`}>
                  <strong>{picked[qi] === mcq.correct ? '✓ Correct!' : `✗ Answer: ${mcq.correct}`}</strong>
                  <p>{mcq.explanation}</p>
                  <span className="cite">📄 {mcq.citation}</span>
                </div>
              )}
            </div>
          ))}

          {/* SAQs */}
          <h2 className="section-title" style={{ marginTop: '2.5rem' }}>
            Short Answer
            <span className="title-note">({data.saqs?.length || 3} questions)</span>
          </h2>

          {data.saqs.map((saq, si) => (
            <div key={si} className="study-card fade-in" style={{ animationDelay: `${si * 0.05}s` }}>
              <p className="q-num">SAQ {si + 1}</p>
              <p className="q-text">{saq.question}</p>

              <button
                className="btn btn-ghost"
                onClick={() => setShowSAQ(p => ({ ...p, [si]: !p[si] }))}
              >
                {showSAQ[si] ? '▾ Hide Answer' : '▸ Reveal Model Answer'}
              </button>

              {showSAQ[si] && (
                <div className="model-answer">
                  <p>{saq.modelAnswer}</p>
                  <span className="cite">📄 {saq.citation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!data && !loading && (
        <div className="empty">
          <span className="empty-icon">◎</span>
          <p>Select a subject and generate questions to start studying</p>
        </div>
      )}
    </div>
  )
}

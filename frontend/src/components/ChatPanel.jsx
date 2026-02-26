import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useUser, useClerk } from '@clerk/clerk-react'
import { askQuestion } from '../api/client'

// Confidence badge colors
const CONF = {
  High: { cls: 'conf-high', label: '● High Confidence' },
  Medium: { cls: 'conf-mid', label: '◐ Medium Confidence' },
  Low: { cls: 'conf-low', label: '○ Low Confidence' },
}

// Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function ChatPanel({ subjects, activeSubjectId, onSubjectChange }) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [isListening, setIsListening] = useState(false)
  const [askedByVoice, setAskedByVoice] = useState(false)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const isSubmittingRef = useRef(false)          // Step 3 — guard against double submit
  const voiceTranscriptRef = useRef('')          // stores final voice text for auto-submit
  const messagesRef = useRef([])                 // keeps latest messages for history

  const subject = subjects.find(s => s._id === activeSubjectId)

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages }, [messages])

  // Reset chat when subject switches
  useEffect(() => { setMessages([]) }, [activeSubjectId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      window.speechSynthesis.cancel()
    }
  }, [])

  // ── Speech Synthesis (text-to-speech for answers) ──
  function speakAnswer(text) {
    if (!text || !speakerEnabled) return
    const plainText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[-*] /gm, '')
      .replace(/^#+\s*/gm, '')
      .replace(/\n+/g, '. ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(plainText)
    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  // ── Speaker toggle ──
  function toggleSpeaker() {
    if (speakerEnabled) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeakerEnabled(false)
    } else {
      setSpeakerEnabled(true)
    }
  }

  // ── Core submit logic — works for both typed and voice ──
  const submitQuestion = useCallback(async (text, wasVoice) => {
    if (!text.trim() || !activeSubjectId) return
    if (!isSignedIn) { openSignIn(); return }     // auth guard for voice path too
    if (isSubmittingRef.current) return   // Step 3 — prevent double submit
    isSubmittingRef.current = true

    const q = text.trim()
    setInput('')
    voiceTranscriptRef.current = ''
    setMessages(p => [...p, { role: 'user', text: q }])
    setLoading(true)

    try {
      const historyToSend = messagesRef.current.slice(-6)
      const res = await askQuestion(activeSubjectId, q, historyToSend)
      setMessages(p => [...p, { role: 'ai', ...res.data }])

      // Speak only if asked by voice
      if (wasVoice && speakerEnabled && res.data.answer) {
        speakAnswer(res.data.answer)
      }
    } catch {
      setMessages(p => [...p, {
        role: 'ai', notFound: true,
        answer: 'Server error — please try again.',
        confidence: 'Low', sourceFiles: [], evidenceSnippets: []
      }])
    } finally {
      setLoading(false)
      setAskedByVoice(false)
      isSubmittingRef.current = false   // Step 3 — reset guard
    }
  }, [activeSubjectId, speakerEnabled])

  // ── Typed submit (Ask button / Enter key) ──
  function handleSend() {
    if (!input.trim() || loading) return
    if (!isSignedIn) { openSignIn(); return }  // Step 5 — auth guard
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    submitQuestion(input, askedByVoice)
  }

  // ── Voice input ──
  function toggleVoice() {
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please try Chrome.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    // Step 2 — mark as voice question
    setAskedByVoice(true)
    voiceTranscriptRef.current = ''

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false    // Step 5 — only final results
    recognition.continuous = false        // Step 5 — stops after user pauses
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript) {
        voiceTranscriptRef.current = transcript
        setInput(transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    // Step 1 — Auto-submit when user stops talking
    recognition.onend = () => {
      setIsListening(false)
      const finalText = voiceTranscriptRef.current
      if (finalText && finalText.trim()) {
        // Small delay to let React state settle, then auto-submit
        setTimeout(() => {
          submitQuestion(finalText, true)
        }, 100)
      }
    }

    recognition.start()
  }

  if (!activeSubjectId) return (
    <div className="page center-page">
      <div className="empty">
        <span className="empty-icon">◉</span>
        <p>Select a subject to start asking questions</p>
        <p className="page-sub" style={{ fontSize: '0.85rem' }}>
          Choose a subject from the top navigation or Setup page
        </p>
      </div>
    </div>
  )

  return (
    <div className="chat-wrap">
      {/* Top bar */}
      <div className="chat-bar">
        <select
          className="select"
          value={activeSubjectId}
          onChange={e => onSubjectChange(e.target.value)}
        >
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>

        {subject && (
          <span className="subject-badge">
            <span>✦</span>
            {subject.name}
          </span>
        )}

        <span className="chat-hint">Answers come only from your uploaded notes</span>

        <button
          className={`btn btn-ghost btn-speaker ${!speakerEnabled ? 'btn-speaker-off' : ''} ${isSpeaking ? 'btn-speaker-active' : ''}`}
          onClick={toggleSpeaker}
          title={speakerEnabled ? 'Voice answers ON — click to mute' : 'Voice answers OFF — click to unmute'}
        >
          {speakerEnabled ? '🔊' : '🔇'}
        </button>
        <button className="btn btn-ghost" onClick={() => setMessages([])}>Clear</button>
      </div>

      {/* Messages */}
      <div className="chat-msgs">
        {messages.length === 0 && (
          <div className="empty">
            <span className="empty-icon">💬</span>
            Ask anything about <strong>{subject?.name}</strong>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role === 'user' ? 'msg-right' : 'msg-left'}`}>
            {m.role === 'user' && (
              <div className="bubble bubble-user">{m.text}</div>
            )}

            {m.role === 'ai' && (
              <div className="bubble bubble-ai">
                <div className={m.notFound ? 'not-found' : 'answer-text markdown-body'}>
                  <ReactMarkdown>{m.answer}</ReactMarkdown>
                </div>

                {!m.notFound && m.confidence && (
                  <span className={`conf-badge ${CONF[m.confidence]?.cls}`}>
                    {CONF[m.confidence]?.label}
                  </span>
                )}

                {!m.notFound && m.sourceFiles?.length > 0 && (
                  <div className="sources">
                    <span className="sources-label">Sources: </span>
                    {m.sourceFiles.map((f, fi) => (
                      <span key={fi} className="source-tag">{f}</span>
                    ))}
                  </div>
                )}

                {!m.notFound && m.evidenceSnippets?.length > 0 && (
                  <div className="evidence">
                    <button
                      className="evidence-toggle"
                      onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                    >
                      {expanded[i] ? '▾ Hide Evidence' : '▸ Show Evidence'}
                    </button>
                    {expanded[i] && (
                      <div className="snippets">
                        {m.evidenceSnippets.map((s, si) => (
                          <blockquote key={si} className="snippet">"{s}"</blockquote>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="msg-row msg-left">
            <div className="bubble bubble-ai loading-bubble">
              <div className="typing-dots">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span style={{ fontSize: '0.85rem' }}>Analyzing your notes...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <div className="chat-input-wrapper">
          <input
            className="input"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              setAskedByVoice(false)   // typing resets the voice flag
            }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isListening ? '🎤 Listening...' : `Ask about ${subject?.name || 'your notes'}...`}
            disabled={loading}
          />
          <button
            className={`btn-mic-inline ${isListening ? 'btn-mic-active' : ''}`}
            onClick={toggleVoice}
            disabled={loading}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? '⏹' : '🎤'}
          </button>
        </div>
        <button
          className="btn-ask"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Ask →'}
        </button>
      </div>
    </div>
  )
}

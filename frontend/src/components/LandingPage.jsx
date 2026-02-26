import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../LandingPage.css'

// Intersection Observer hook for scroll animations
function useScrollReveal() {
    const ref = useRef([])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        )

        ref.current.forEach(el => {
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [])

    return (el) => {
        if (el && !ref.current.includes(el)) {
            ref.current.push(el)
        }
    }
}

export default function LandingPage() {
    const navigate = useNavigate()
    const addRef = useScrollReveal()

    function scrollToSection(id) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="landing">
            {/* Animated background */}
            <div className="landing-bg">
                <div className="landing-blob landing-blob-1" />
                <div className="landing-blob landing-blob-2" />
                <div className="landing-blob landing-blob-3" />
                <div className="landing-blob landing-blob-4" />
            </div>

            <div className="landing-content">
                {/* ── Navigation ── */}
                <nav className="landing-nav">
                    <div className="landing-nav-brand">
                        <div className="brand-mark">✦</div>
                        <span className="brand-name">Ask<span>My</span>Notes</span>
                    </div>

                    <div className="landing-nav-links">
                        <button className="landing-nav-link" onClick={() => scrollToSection('how')}>
                            How It Works
                        </button>
                        <button className="landing-nav-link" onClick={() => scrollToSection('features')}>
                            Features
                        </button>
                        <button className="landing-nav-link" onClick={() => scrollToSection('why')}>
                            Why Us
                        </button>
                        <button className="landing-nav-cta" onClick={() => navigate('/app')}>
                            Launch App →
                        </button>
                    </div>
                </nav>

                {/* ── Hero ── */}
                <section className="hero">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Powered by RAG + Gemini 1.5
                    </div>

                    <h1>Your Private AI<br />Study Copilot</h1>

                    <p className="hero-sub">
                        Upload your notes. Ask questions. Generate study material.
                        Learn smarter — with answers strictly grounded in your content.
                    </p>

                    <div className="hero-actions">
                        <button className="hero-btn-primary" onClick={() => navigate('/app')}>
                            Get Started
                            <span>→</span>
                        </button>
                        <button className="hero-btn-secondary" onClick={() => scrollToSection('how')}>
                            See How It Works
                        </button>
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section id="how" className="how-section">
                    <div className="section-header" ref={addRef}>
                        <div className="anim-in" ref={addRef}>
                            <span className="section-label">How It Works</span>
                            <h2 className="section-heading">Three simple steps</h2>
                            <p className="section-desc">
                                From raw notes to an intelligent study companion in minutes.
                            </p>
                        </div>
                    </div>

                    <div className="steps-grid">
                        <div className="step-card anim-in" ref={addRef}>
                            <p className="step-num">Step 01</p>
                            <div className="step-icon">📄</div>
                            <h3 className="step-title">Upload Your Notes</h3>
                            <p className="step-desc">
                                Drop your PDF or TXT files into any subject. Your data stays private and isolated.
                            </p>
                        </div>

                        <div className="step-card anim-in" ref={addRef}>
                            <p className="step-num">Step 02</p>
                            <div className="step-icon">💬</div>
                            <h3 className="step-title">Ask Questions</h3>
                            <p className="step-desc">
                                Ask anything about your notes. Get cited answers scoped to the selected subject.
                            </p>
                        </div>

                        <div className="step-card anim-in" ref={addRef}>
                            <p className="step-num">Step 03</p>
                            <div className="step-icon">✦</div>
                            <h3 className="step-title">Study Mode</h3>
                            <p className="step-desc">
                                Generate MCQs and short answer questions with explanations and citations.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Core Features ── */}
                <section id="features" className="features-section">
                    <div className="section-header">
                        <div className="anim-in" ref={addRef}>
                            <span className="section-label">Core Features</span>
                            <h2 className="section-heading">Built for focused learning</h2>
                            <p className="section-desc">
                                Every feature is designed to keep your study grounded, cited, and productive.
                            </p>
                        </div>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card anim-in" ref={addRef}>
                            <div className="feature-icon">🔒</div>
                            <div className="feature-info">
                                <h3 className="feature-title">Strict Subject Isolation</h3>
                                <p className="feature-desc">
                                    Answers come only from the selected subject's notes. No cross-contamination between topics.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card anim-in" ref={addRef}>
                            <div className="feature-icon">📎</div>
                            <div className="feature-info">
                                <h3 className="feature-title">Citations + Evidence</h3>
                                <p className="feature-desc">
                                    Every response includes source file references and expandable evidence snippets from your notes.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card anim-in" ref={addRef}>
                            <div className="feature-icon">📊</div>
                            <div className="feature-info">
                                <h3 className="feature-title">Confidence Scoring</h3>
                                <p className="feature-desc">
                                    Each answer shows High, Medium, or Low confidence so you know how reliable the response is.
                                </p>
                            </div>
                        </div>

                        <div className="feature-card anim-in" ref={addRef}>
                            <div className="feature-icon">🎙️</div>
                            <div className="feature-info">
                                <h3 className="feature-title">Voice-Based Teacher Mode</h3>
                                <p className="feature-desc">
                                    Ask questions by voice and listen to AI-generated answers. Multi-turn conversation supported.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Why Different ── */}
                <section id="why" className="why-section">
                    <div className="anim-in" ref={addRef}>
                        <div className="why-card">
                            <h2 className="why-heading">Why AskMyNotes Is Different</h2>
                            <p className="why-text">
                                Unlike generic AI tools, AskMyNotes uses a controlled Retrieval-Augmented Generation architecture.
                                The system never guesses. If your notes don't contain the answer, it says so — clearly and honestly.
                            </p>
                            <div className="why-refusal">
                                ⚠️ "Not found in your notes for [Subject]"
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Final CTA ── */}
                <section className="cta-section">
                    <div className="anim-in" ref={addRef}>
                        <div className="cta-card">
                            <div className="cta-content">
                                <h2 className="cta-heading">
                                    Ready to turn your notes<br />into a personal AI tutor?
                                </h2>
                                <p className="cta-sub">
                                    Upload, ask, and study — all grounded in your own content.
                                </p>
                                <button className="cta-btn" onClick={() => navigate('/app')}>
                                    Launch App
                                    <span>→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="landing-footer">
                    <div className="footer-left">
                        <div className="footer-brand">
                            <div className="brand-mark">✦</div>
                            <span className="brand-name">Ask<span>My</span>Notes</span>
                        </div>
                        <span className="footer-tagline">Your private AI study copilot</span>
                    </div>

                    <div className="footer-right">
                        <a
                            className="footer-link"
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                        </a>
                        <span className="footer-tech">
                            ⚡ Built with Gemini 1.5 + RAG
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    )
}

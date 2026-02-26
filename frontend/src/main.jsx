import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import LandingPage from './components/LandingPage'
import './App.css'

const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
    <ClerkProvider publishableKey={key}>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<App />} />
            </Routes>
        </BrowserRouter>
    </ClerkProvider>
)

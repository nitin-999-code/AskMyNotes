import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001' })

// Set the Clerk userId as a header on all requests
export function setUserId(clerkId) {
  api.defaults.headers.common['x-user-id'] = clerkId
}

// Subjects
export const getSubjects = () => api.get('/subjects')
export const createSubject = (name) => api.post('/subjects', { name })
export const deleteSubject = (id) => api.delete(`/subjects/${id}`)
export const renameSubject = (id, name) => api.put(`/subjects/${id}`, { name })
export const uploadFiles = (id, files) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  return api.post(`/subjects/${id}/upload`, form)
}

// User sync — creates or updates the user in MongoDB on first login
export const syncUser = (clerkId, email, name, imageUrl) =>
  api.post('/users/sync', { clerkId, email, name, imageUrl })

// Q&A
export const askQuestion = (subjectId, question, history = []) =>
  api.post('/qa/ask', { subjectId, question, history })

// Study Mode
export const generateStudy = (subjectId) =>
  api.post('/study/generate', { subjectId })

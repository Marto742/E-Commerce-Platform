/**
 * Generates and persists a guest session ID in localStorage.
 * Used as the X-Session-ID header for unauthenticated cart API calls.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('x-session-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('x-session-id', id)
  }
  return id
}

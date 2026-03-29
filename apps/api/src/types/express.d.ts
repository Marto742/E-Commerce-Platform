// Extends Express Request with the authenticated user payload.
// Populated by the authenticate() middleware (Phase 3).
declare namespace Express {
  interface Request {
    user?: {
      id: string
      role: 'GUEST' | 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
      status: 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'
    }
  }
}

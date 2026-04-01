// Extends Express Request with custom middleware payloads.
declare namespace Express {
  interface Request {
    // Populated by authenticate() middleware (Phase 3).
    user?: {
      id: string
      role: 'GUEST' | 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
      status: 'UNVERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'
    }

    // Populated by requestId() middleware.
    id?: string

    // Populated by parsePagination() middleware.
    pagination?: {
      page: number
      limit: number
      skip: number
    }
  }
}

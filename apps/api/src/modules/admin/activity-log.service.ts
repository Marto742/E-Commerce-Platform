import { prisma } from '@/lib/prisma'
import { buildPaginationMeta } from '@/utils/response'

// ─── Log (fire-and-forget) ────────────────────────────────────────────────────

export function logActivity(
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>
): void {
  prisma.activityLog
    .create({
      data: {
        adminId,
        action,
        entity,
        entityId: entityId ?? null,
        meta: meta ?? null,
      },
    })
    .catch(() => {
      // logging failures must never surface to the caller
    })
}

// ─── List (admin) ─────────────────────────────────────────────────────────────

export interface ActivityLogQuery {
  page: number
  limit: number
  entity?: string
  adminId?: string
}

export async function listActivityLogs(query: ActivityLogQuery) {
  const { page, limit, entity, adminId } = query
  const skip = (page - 1) * limit

  const where = {
    ...(entity && { entity }),
    ...(adminId && { adminId }),
  }

  const [logs, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ])

  return { logs, meta: buildPaginationMeta(total, page, limit) }
}

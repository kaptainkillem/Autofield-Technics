export async function saveSuperAdminSettings(
  workshopId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch('/api/admin/super-admin/workshop-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workshopId, ...payload }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any)?.error || 'Failed to save settings')
  }
}

export async function saveAdminSettings(
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any)?.error || 'Failed to save settings')
  }
}

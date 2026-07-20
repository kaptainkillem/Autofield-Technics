import type { TemplateDef, TemplatePayload } from './types'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, escapeHtml(value || ''))
  }
  return result
}

export function getDefaultTemplate(templateKey: string, allTemplates: Record<string, TemplateDef>): TemplateDef | null {
  return allTemplates[templateKey] ?? null
}

export function buildTemplateEmail(
  templateKey: string,
  variables: Record<string, string>,
  allTemplates: Record<string, TemplateDef>,
  overrides?: Partial<TemplateDef>,
): TemplatePayload | null {
  const def = getDefaultTemplate(templateKey, allTemplates)
  if (!def) return null

  const merged = { ...def, ...overrides }

  return {
    to: '',
    subject: renderTemplate(merged.subject, variables),
    html: renderTemplate(merged.html, variables),
    text: renderTemplate(merged.text, variables),
    templateKey,
    variables,
  }
}

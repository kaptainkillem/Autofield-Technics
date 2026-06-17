type SEORecordArgs = {
  meta_title: string
  meta_description: string
  meta_keywords: string
  h1_heading: string
}

export type SEOAuditResult = {
  score: number
  colorClass: string // For badge backgrounds
  textClass: string
  missingChecklist: string[]
}

export function calculateSEOScore(record: SEORecordArgs): SEOAuditResult {
  let score = 100
  const missingChecklist: string[] = []

  const titleLen = (record.meta_title || '').length
  const descLen = (record.meta_description || '').length
  const keywords = (record.meta_keywords || '').split(',').filter(k => k.trim().length > 0)
  const h1 = (record.h1_heading || '').trim()

  // 1. Validate Meta Title Length
  if (titleLen === 0) {
    score -= 30
    missingChecklist.push('Meta Title is completely empty.')
  } else if (titleLen < 30) {
    score -= 10
    missingChecklist.push(`Meta Title is too short (${titleLen} ch). Aim for 30–60 characters for ideal click-through rates.`)
  } else if (titleLen > 60) {
    score -= 15
    missingChecklist.push(`Meta Title is too long (${titleLen} ch). Text will be cut off with "..." in Google search results.`)
  }

  // 2. Validate Meta Description Length
  if (descLen === 0) {
    score -= 30
    missingChecklist.push('Meta Description is missing entirely.')
  } else if (descLen < 110) {
    score -= 10
    missingChecklist.push(`Meta Description is too short (${descLen} ch). Expand to 110–160 characters to better describe the page intent.`)
  } else if (descLen > 160) {
    score -= 15
    missingChecklist.push(`Meta Description is too long (${descLen} ch). Snippet text will be truncated on standard screens.`)
  }

  // 3. Validate Focus Keywords Density
  if (keywords.length === 0) {
    score -= 20
    missingChecklist.push('No Focus Keywords are defined. Add comma-separated search phrases.')
  } else if (keywords.length < 3) {
    score -= 10
    missingChecklist.push(`Low keyword target density (${keywords.length} added). Aim for at least 3 distinct target search terms.`)
  }

  // 4. Validate H1 Presence & Consistency
  if (!h1) {
    score -= 20
    missingChecklist.push('H1 Screen Viewport Heading is missing. Your page needs a clear primary structural header.')
  }

  // Bound check safety
  score = Math.max(0, score)

  // Determine color coding categories based on calculated score matrices
  let colorClass = 'bg-error/10 text-error border-error/20'
  let textClass = 'text-error'
  
  if (score >= 85) {
    colorClass = 'bg-success/10 text-success border-success/20'
    textClass = 'text-success'
  } else if (score >= 50) {
    colorClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    textClass = 'text-amber-600'
  }

  return { score, colorClass, textClass, missingChecklist }
}
export interface TemplateDef {
  subject: string
  html: string
  text: string
}

export interface TemplatePayload {
  to: string
  subject: string
  html: string
  text: string
  templateKey: string
  variables: Record<string, string>
}

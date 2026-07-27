const LAUGHTER_DIRECTION_PATTERNS = [
  /\*{1,2}\s*(?:laughs?|chuckles?|giggles?)\s*\*{1,2}/gi,
  /\[\s*(?:laughs?|chuckles?|giggles?)\s*\]/gi,
  /\(\s*(?:laughs?|chuckles?|giggles?)\s*\)/gi,
]

export function normalizeAssistantSpeech(text: string): string {
  let normalized = text
  for (const pattern of LAUGHTER_DIRECTION_PATTERNS) {
    normalized = normalized.replace(pattern, "Ha—")
  }
  return normalized
    .replace(/[ \t]+([,.!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

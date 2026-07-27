import type { EvaluateResponse } from "@/lib/api"

const evaluationCache = new Map<string, EvaluateResponse>()

export function cacheEvaluation(
  sessionId: string,
  evaluation: EvaluateResponse,
): void {
  evaluationCache.set(sessionId, evaluation)
}

export function takeCachedEvaluation(
  sessionId: string,
): EvaluateResponse | undefined {
  const evaluation = evaluationCache.get(sessionId)
  evaluationCache.delete(sessionId)
  return evaluation
}

export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  const details = error instanceof Error ? { message: error.message, stack: error.stack } : { error };
  console.error("[Safety Gear Hub] Runtime error", { ...details, ...context });
}

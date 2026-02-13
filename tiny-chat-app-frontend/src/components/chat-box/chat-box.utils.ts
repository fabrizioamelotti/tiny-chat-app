/**
 * Generate a UUID manually.
 *
 * Why?
 * Because the crypto.randomUUID() is too heavy for the UI and for this purpose
 */
export function generateUUIDChatMessage() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

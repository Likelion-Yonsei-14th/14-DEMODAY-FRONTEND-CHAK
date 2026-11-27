const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/**
 * Returns the value only when it is a plain hex color (#rgb, #rgba, #rrggbb,
 * #rrggbbaa). Object colors come from message senders and end up in CSS custom
 * properties, where something like `url(https://...)` would make every viewer's
 * browser fetch a remote URL, so anything else is dropped.
 */
export function safeHexColor(value: unknown): string | undefined {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : undefined
}

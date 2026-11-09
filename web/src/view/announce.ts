/** Speak to screen readers through the page's polite live region (`#sr`). */
export function announce(message: string): void {
  const region = document.getElementById('sr');
  if (!region) return;
  // A live region only speaks when its text changes, so a repeat has to differ.
  region.textContent = region.textContent === message ? `${message} ` : message;
}

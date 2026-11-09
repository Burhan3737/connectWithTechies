/** Bring the start of the results to the top of the window, unless they are already there. */
export function scrollToResults(): void {
  const top = document.querySelector('main')?.offsetTop ?? 0;
  if (window.scrollY < top || window.scrollY > top + 40) window.scrollTo(0, top);
}

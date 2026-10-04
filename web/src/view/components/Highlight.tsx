import { splitMatch } from '../../model/text';

/** Text with its first match of the search marked. React escapes the text; nothing here is markup. */
export function Highlight({ text, needle }: { text: string; needle: string }) {
  const parts = splitMatch(text, needle);
  if (!parts) return <>{text}</>;
  return <>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</>;
}

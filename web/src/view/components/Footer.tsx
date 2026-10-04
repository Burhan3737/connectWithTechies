import { useApp } from '../context';

export function Footer() {
  const { tally } = useApp();
  return (
    <footer className="foot">
      <p>
        <span className="foot__mark">▶</span> connectWithTechies — an open directory. Every listing links to the
        organiser’s own page; always confirm dates there before you book anything.
      </p>
      <p className="foot__meta" id="footmeta">
        Dataset generated {tally.generatedOn} · {tally.events} events · {tally.cities} cities
      </p>
    </footer>
  );
}

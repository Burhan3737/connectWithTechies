import { useMaybeApp } from '../context';

const CREDIT_LINKS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mburhantahir/' },
];

/** Title, standfirst and the tally. Renders before the data arrives; the numbers follow. */
export function Masthead() {
  const vm = useMaybeApp();
  const t = vm?.tally;
  return (
    <header className="masthead">
      <div className="masthead__rule">
        <span>NORTH AMERICA</span>
        <span className="masthead__dots" aria-hidden="true" />
        <span className="masthead__credit">
          <span>Created by <span className="masthead__name">Burhan</span></span>
          {CREDIT_LINKS.map((link) => (
            <a key={link.label} className="masthead__link" href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}<span aria-hidden="true"> ↗</span>
            </a>
          ))}
        </span>
      </div>
      <h1 className="masthead__title">
        <span className="masthead__connect">connectWith</span><span className="masthead__techies">Techies</span>
      </h1>
      <p className="masthead__sub">
        A departures board for tech events — hackathons, conferences, tech&nbsp;weeks, CTFs, meetups and demo nights
        across the <em>United&nbsp;States</em> and <em>Canada</em>. Pick your city.
      </p>
      <dl className="tally" id="tally">
        {t && (
          <>
            <Figure label="Events tracked" value={t.events} />
            <Figure label="Cities" value={t.cities} />
            <Figure label="Dated & upcoming" value={t.upcoming} />
            <Figure label="Annual, date TBA" value={t.tbd} />
            <Figure label="Countries" value={2} unit="US / CA" />
          </>
        )}
      </dl>
    </header>
  );
}

function Figure({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}{unit && <span className="u">{unit}</span>}</dd>
    </div>
  );
}

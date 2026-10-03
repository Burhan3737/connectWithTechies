/**
 * Could you meet tech people here?
 *
 * The bar is deliberately low — a founders' happy hour, a product builders'
 * night, a design meetup and a hackathon all belong. What does not is the rest
 * of what general platforms carry: a city's Luma page mixed a cardinal's
 * evening of prayer, a romantasy book club and a film premiere in with the
 * founder mixers. And those platforms carry a steady stream of spam dressed as
 * networking — real-estate investing, forex "signals", make-money-online.
 *
 * Returns { keep, score, reason } so every decision can be audited.
 */

// Strong: one in the title is enough on its own.
const STRONG = [
  'hackathon', 'hack night', 'hacknight', 'buildathon', 'codeathon', 'game jam', 'ctf', 'capture the flag',
  'developer', 'developers', 'devs', 'engineer', 'engineers', 'engineering', 'programmer', 'programming',
  'software', 'coding', 'coders', 'open source', 'devops', 'sre', 'platform engineering',
  'founder', 'founders', 'cofounder', 'co-founder', 'startup', 'startups', 'entrepreneur', 'entrepreneurs',
  'vc', 'venture capital', 'investors', 'angel investor', 'pitch night', 'pitch competition', 'demo day', 'demo night',
  'ai', 'a.i.', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'llms', 'genai', 'gen ai', 'gpt',
  'ai agents', 'agentic', 'data science', 'data engineering', 'analytics', 'mlops',
  'cybersecurity', 'infosec', 'security meetup', 'bsides', 'owasp',
  'product manager', 'product managers', 'product management', 'product builders', 'builders',
  'ux', 'ui/ux', 'product design', 'design systems',
  'web3', 'blockchain', 'ethereum', 'solidity', 'crypto builders',
  'robotics', 'hardware', 'embedded', 'iot', 'maker', 'makerspace', 'hackerspace',
  'cloud', 'kubernetes', 'aws', 'azure', 'gcp', 'saas', 'fintech', 'healthtech', 'edtech', 'climate tech', 'climatetech',
  'python', 'javascript', 'typescript', 'rust', 'golang', 'java', 'react', 'node.js', 'nodejs', 'swift', 'kotlin',
  'tech', 'technology', 'techies', 'tech week', 'tech meetup', 'tech talk', 'tech networking', 'women in tech',
  'quantum', 'semiconductor', 'biotech', 'deep tech', 'deeptech', 'devrel', 'api', 'apis',
  // Seen in real titles the first pass missed: engineers name the work, not the field.
  'code', 'hack', 'hacks', 'inference', 'gpu', 'gpus', 'compute', 'observability', 'infrastructure',
  'open models', 'open-source', 'agents', 'sandboxes', 'neural', 'foundation models', 'model training',
  'build night', 'build bar', 'ship it', 'shipping', 'design night', 'design critique', 'design roast', 'design roasting',
  // Second pass, from the dropped list: languages, game dev, research venues, press.
  'go meetup', 'gophers', 'game dev', 'gamedev', 'game developers', 'indie games', 'game development',
  'threat modeling', 'threatmodcon', 'appsec', 'neurips', 'icml', 'iclr', 'colm', 'cvpr', 'physical intelligence',
  'techcrunch', 'y combinator', 'yc', 'proptech',
  // Third pass, from a random sample of a full run's drops.
  'robot', 'robots', 'humanoid', 'hackaday', '3d printing', '3d printer', 'cnc', 'laser cutter', 'arduino',
  'raspberry pi', 'product people', 'product meetup', 'product happy hour', 'product leaders', 'productcon', 'producttank', 'space week', 'aerospace', 'satellite', 'design development', 'design and development',
  'web design', 'google', 'microsoft', 'nvidia', 'openai', 'anthropic', 'github', 'figma',
];

// Clearly not our subject, or spam wearing a networking badge.
const NEGATIVE = [
  'prayer', 'worship', 'church', 'bible', 'mass ', 'rosary', 'sermon', 'ministry',
  'book club', 'romantasy', 'poetry', 'knitting', 'crochet', 'watercolor', 'painting class', 'pottery',
  'yoga', 'pilates', 'meditation retreat', 'sound bath', 'breathwork',
  'speed dating', 'singles', 'dating mixer', 'matchmaking',
  'wine tasting', 'beer tasting', 'bar crawl', 'pub crawl', 'brunch party', 'day party',
  'comedy show', 'stand-up comedy', 'open mic', 'karaoke', 'concert', 'dj set', 'rave', 'film premiere', 'premiere night',
  'real estate', 'reia', 'real estate investing', 'real estate investor', 'wholesaling', 'rental property', 'airbnb business', 'flip houses',
  'forex', 'trading signals', 'day trading', 'options trading', 'make money online', 'passive income', 'network marketing',
  'mlm', 'financial freedom', 'credit repair', 'bitcoin mining profits',
  'kids camp', 'toddler', 'baby shower', 'bridal', 'wedding expo',
  // Paid corporate courses, which Eventbrite often tags "High Tech": a classroom
  // of trainees, not a room to meet people. Run city by city as "| 1 Day Calgary".
  '1 day', '1-day', '2 day', '2-day', '3 day', '3-day', 'skills training', 'training course',
  'certification training', 'negotiation', 'conflict management', 'presentation skills',
  'cbap', 'pmp', 'six sigma', 'leadership training', 'course in',
];

// Phrases whose tech-sounding word means something else: a "business developers"
// meeting is sales, a "real estate developer" builds houses. Removed before matching.
const FALSE_FRIENDS = /\b(business|real estate|property|land|personal|self|leadership|community|economic) develop(ers?|ment)\b/g;
const words = (s) => ` ${String(s || '').toLowerCase().replace(FALSE_FRIENDS, ' ')
  .replace(/[^a-z0-9+#./-]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
const has = (hay, term) => hay.includes(` ${term} `) || (term.endsWith(' ') && hay.includes(` ${term}`));

function hits(hay, list) { return list.filter((t) => has(hay, t.trim())); }

/**
 * Is an organiser a tech community?
 *
 * Luma's discovery data carries no event descriptions, but it does describe
 * the calendar that hosts each event — "AI infrastructure that developers
 * love" is Modal — and that is the strongest signal available. Titles like
 * "Runtime by Modal" or "init() by WorkOS" contain no tech word at all.
 *
 * Two routes to yes: the organiser's own description, or its track record —
 * if most of its events clearly pass on their titles, it is a tech organiser
 * even when its description says nothing ("Events managed by Supabase").
 */
export function judgeOrganiser({ name, description, website }, eventTitles = []) {
  const text = words(`${name || ''} ${description || ''} ${website || ''}`);
  const pos = hits(text, STRONG);
  const neg = hits(text, NEGATIVE);
  if (neg.length && !pos.length) return { tech: false, reason: `organiser off-topic: ${neg[0]}` };
  if (pos.length) return { tech: true, reason: `organiser described as: ${pos.slice(0, 3).join(', ')}` };
  const passing = eventTitles.filter((t) => hits(words(t), STRONG).length && !hits(words(t), NEGATIVE).length);
  if (eventTitles.length >= 2 && passing.length * 2 >= eventTitles.length) {
    return { tech: true, reason: `track record: ${passing.length}/${eventTitles.length} events clearly tech` };
  }
  return { tech: false, reason: 'no tech signal in organiser' };
}

/**
 * @param {object} e        { title, description, organiser }
 * @param {object} context  { sourceIsTech, organiserIsTech }
 */
export function judge(e, { sourceIsTech = false, organiserIsTech = false } = {}) {
  const title = words(e.title);
  const org = typeof e.organiser === 'object' ? e.organiser?.name : e.organiser;
  const body = words(`${e.description || ''} ${org || ''}`);

  const tPos = hits(title, STRONG);
  const bPos = hits(body, STRONG);
  const tNeg = hits(title, NEGATIVE);
  const bNeg = hits(body, NEGATIVE);

  // A dedicated tech source (Devpost, MLH, confs.tech) is tech by construction.
  if (sourceIsTech) return { keep: true, score: 10, reason: 'tech-only source' };

  // Spam and off-topic titles lose even if they borrow a tech word
  // ("AI for real estate investors", "crypto passive income").
  // ...unless the title is plainly tech twice over: "Tech Comedy Show @ SF Tech
  // Week" is a room full of tech people, while "AI for real estate investors"
  // has one borrowed word and is still dropped.
  if (tNeg.length && tPos.length < 2) return { keep: false, score: -5, reason: `off-topic title: ${tNeg[0]}` };

  // A calendar we registered because its organiser is a tech community gets
  // the benefit of the doubt on everything except an off-topic title.
  if (organiserIsTech) return { keep: true, score: 6, reason: 'registered tech organiser' };
  // The platform itself filed it under technology (Meetup's Technology category).
  if (e.platformTech) return { keep: true, score: 5, reason: `filed under technology on ${e.platformTech}` };

  if (tPos.length) {
    if (bNeg.length >= 2 && tPos.length === 1) {
      return { keep: false, score: 0, reason: `tech word "${tPos[0]}" but body is off-topic: ${bNeg.slice(0, 2).join(', ')}` };
    }
    return { keep: true, score: 3 + tPos.length, reason: `title: ${tPos.slice(0, 3).join(', ')}` };
  }
  if (bPos.length >= 2 && !bNeg.length) {
    return { keep: true, score: 2, reason: `description: ${bPos.slice(0, 3).join(', ')}` };
  }
  return { keep: false, score: bPos.length - bNeg.length,
    reason: bPos.length ? `only one weak signal: ${bPos[0]}` : 'no tech signal' };
}

import { descriptionLine, fold, slugify, splitMatch } from './text';

describe('fold', () => {
  it('ignores case and accents', () => {
    expect(fold('Montréal')).toBe('montreal');
    expect(fold('ÇA VA')).toBe('ca va');
  });
  it('treats missing values as empty', () => {
    expect(fold(undefined)).toBe('');
    expect(fold(null)).toBe('');
  });
});

describe('slugify', () => {
  it('makes file-safe names', () => {
    expect(slugify("AI Builders' Night!")).toBe('ai-builders-night');
    expect(slugify('  --Hack--  ')).toBe('hack');
  });
  it('caps the length', () => expect(slugify('a'.repeat(100), 10)).toHaveLength(10));
});

describe('splitMatch', () => {
  it('splits around the first match, case-insensitively', () => {
    expect(splitMatch('Toronto Tech Week', 'tech')).toEqual(['Toronto ', 'Tech', ' Week']);
  });
  it('finds accented text from a plain needle and keeps the original accents', () => {
    expect(splitMatch('Montréal AI Night', 'montreal')).toEqual(['', 'Montréal', ' AI Night']);
  });
  it('returns null when there is nothing to mark', () => {
    expect(splitMatch('Toronto', 'zzz')).toBeNull();
    expect(splitMatch('Toronto', '')).toBeNull();
  });
});

describe('descriptionLine', () => {
  it('shows the organiser in place of a feed placeholder', () => {
    expect(descriptionLine('Listed on Luma by Acme.')).toBe('by Acme');
    expect(descriptionLine('Listed on Meetup by A Group')).toBe('by A Group');
    expect(descriptionLine('Listed on Eventbrite by Made by Hand.')).toBe('by Made by Hand');
  });
  it('keeps the full stop that belongs to the organiser', () => {
    expect(descriptionLine('Listed on Luma by Foo Inc..')).toBe('by Foo Inc.');
  });
  it('reads a calendar feed named after its organiser', () => {
    expect(descriptionLine('Listed on Security BSides by Security BSides.')).toBe('by Security BSides');
  });
  it('keeps a series line in front of the organiser', () => {
    expect(descriptionLine('Meets monthly; also Dec 9. Listed on Luma by VC in DC.')).toBe('Meets monthly; also Dec 9 · by VC in DC');
  });
  it('says nothing when a placeholder names no organiser', () => {
    expect(descriptionLine('Listed on Eventbrite.')).toBe('');
    expect(descriptionLine('Meets weekly; also Dec 9. Listed on Luma.')).toBe('Meets weekly; also Dec 9');
  });
  it('leaves a real description that happens to start the same way', () => {
    expect(descriptionLine('Listed on Forbes by our members as a top meetup.')).toBe('Listed on Forbes by our members as a top meetup.');
  });
  it('strips escaped and plain markdown emphasis', () => {
    expect(descriptionLine('A **bold** claim\\*\\*')).toBe('A bold claim');
  });
  it('copes with nothing at all', () => expect(descriptionLine(undefined)).toBe(''));
  it('keeps a real description', () => expect(descriptionLine('Hands-on Git workshop.')).toBe('Hands-on Git workshop.'));
});

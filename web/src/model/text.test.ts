import { cleanDescription, fold, slugify, splitMatch } from './text';

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

describe('cleanDescription', () => {
  it('drops the placeholder a feed leaves when an organiser wrote nothing', () => {
    expect(cleanDescription('Listed on Luma by Acme')).toBe('');
    expect(cleanDescription('Listed on Meetup by A Group')).toBe('');
    expect(cleanDescription('Listed on Eventbrite by Someone')).toBe('');
  });
  it('strips escaped and plain markdown emphasis', () => {
    expect(cleanDescription('A **bold** claim\\*\\*')).toBe('A bold claim');
  });
  it('copes with nothing at all', () => expect(cleanDescription(undefined)).toBe(''));
  it('keeps a real description', () => expect(cleanDescription('Hands-on Git workshop.')).toBe('Hands-on Git workshop.'));
});

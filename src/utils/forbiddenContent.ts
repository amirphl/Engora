import { ForbiddenEntries } from '../data/generatedForbiddenTerms';

const WORD_CHARACTER_PATTERN = /[\p{L}\p{N}]/u;
const PERSIAN_OR_ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const INVISIBLE_CHARACTERS = /[\u200C\u200D\u200E\u200F\uFEFF]/g;

interface ForbiddenEntry {
  term: string;
  exceptions: string[];
  isWholeWord: boolean;
}

/**
 * Normalizes common Persian/Arabic character variants and English case so that
 * equivalent text is evaluated consistently against the source list.
 */
export const normalizeForbiddenContent = (value: string): string =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ـ/g, '')
    .replace(PERSIAN_OR_ARABIC_DIACRITICS, '')
    .replace(INVISIBLE_CHARACTERS, '')
    .replace(/\s+/g, ' ')
    .trim();

const isWordCharacter = (character: string | undefined): boolean =>
  Boolean(character && WORD_CHARACTER_PATTERN.test(character));

const isWholeWord = (term: string): boolean =>
  Array.from(term).every(character => WORD_CHARACTER_PATTERN.test(character));

const forbiddenEntries: ForbiddenEntry[] = ForbiddenEntries
  .map(rawEntry => {
    const [term = '', ...exceptions] = rawEntry
      .replace(/^!/, '')
      .split(',')
      .map(normalizeForbiddenContent);

    return {
      term,
      exceptions: exceptions.filter(Boolean),
      isWholeWord: isWholeWord(term),
    };
  })
  .filter(entry => Boolean(entry.term));

const matchIsExcluded = (
  content: string,
  term: string,
  matchIndex: number,
  exceptions: string[]
): boolean =>
  exceptions.some(exception => {
    let exceptionIndex = content.indexOf(exception);
    while (exceptionIndex !== -1) {
      const exceptionEnd = exceptionIndex + exception.length;
      if (
        matchIndex >= exceptionIndex &&
        matchIndex + term.length <= exceptionEnd
      ) {
        return true;
      }
      exceptionIndex = content.indexOf(exception, exceptionIndex + 1);
    }
    return false;
  });

/**
 * Returns the first prohibited entry contained in a message, or null when the
 * message is allowed. A leading ! in the source file is metadata, not part of
 * the text to search for. Entries after a comma are exceptions to that term.
 */
export const findForbiddenContentMatch = (value: string): string | null => {
  const content = normalizeForbiddenContent(value);
  if (!content) return null;

  for (const entry of forbiddenEntries) {
    let matchIndex = content.indexOf(entry.term);
    while (matchIndex !== -1) {
      const before = content[matchIndex - 1];
      const after = content[matchIndex + entry.term.length];
      const isBoundedWord =
        !entry.isWholeWord ||
        (!isWordCharacter(before) && !isWordCharacter(after));

      if (
        isBoundedWord &&
        !matchIsExcluded(content, entry.term, matchIndex, entry.exceptions)
      ) {
        return entry.term;
      }

      matchIndex = content.indexOf(entry.term, matchIndex + 1);
    }
  }

  return null;
};

export const containsForbiddenContent = (value: string): boolean =>
  findForbiddenContentMatch(value) !== null;

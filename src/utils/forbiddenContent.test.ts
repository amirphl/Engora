import { describe, expect, it } from '@jest/globals';
import {
  containsForbiddenContent,
  findForbiddenContentMatch,
  normalizeForbiddenContent,
} from './forbiddenContent';

describe('forbidden content matching', () => {
  it('matches English entries without regard to case', () => {
    expect(containsForbiddenContent('Learn about BITCOIN today')).toBe(true);
  });

  it('matches multi-word Persian entries across Persian character variants', () => {
    expect(
      containsForbiddenContent('برای خرید بیت‌کوین همین امروز اقدام کنید')
    ).toBe(true);
  });

  it('does not match a short English entry inside another word', () => {
    expect(containsForbiddenContent('Tell me whether it is open')).toBe(false);
  });

  it('honors source-list exceptions', () => {
    expect(containsForbiddenContent('نعمانی')).toBe(false);
    expect(containsForbiddenContent('سفر به عمان')).toBe(true);
  });

  it('normalizes Arabic Persian variants before matching', () => {
    expect(normalizeForbiddenContent('بِيت‌كوين')).toBe('بیتکوین');
    expect(findForbiddenContentMatch('بِيت‌كوين')).toBe('بیتکوین');
  });
});

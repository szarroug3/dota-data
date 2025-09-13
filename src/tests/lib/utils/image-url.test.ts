import { formatHeroImageUrl, formatItemImageUrl } from '../../../lib/utils/image-url';

describe('image-url utils', () => {
  describe('formatItemImageUrl', () => {
    it('should format item image URL correctly', () => {
      const itemImagePath = '/apps/dota2/images/dota_react/items/blink.png?t=1593393829403';
      const expected = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/blink.png?t=1593393829403';
      expect(formatItemImageUrl(itemImagePath)).toBe(expected);
    });

    it('should preserve alphanumeric characters, slashes, periods, hyphens, and underscores', () => {
      const itemImagePath = '/apps/dota2/images/dota_react/items/blink-dagger_v2.png?t=1593393829403';
      const expected = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/blink-dagger_v2.png?t=1593393829403';
      expect(formatItemImageUrl(itemImagePath)).toBe(expected);
    });
  });

  describe('formatHeroImageUrl', () => {
    it('should format hero image URL correctly', () => {
      const heroName = 'npc_dota_hero_antimage';
      const expected = 'https://dota2protracker.com/static/heroes/antimage_vert.jpg';
      expect(formatHeroImageUrl(heroName)).toBe(expected);
    });

    it('should handle hero name without prefix', () => {
      const heroName = 'antimage';
      const expected = 'https://dota2protracker.com/static/heroes/antimage_vert.jpg';
      expect(formatHeroImageUrl(heroName)).toBe(expected);
    });
  });
}); 
import {
  CACHE_VERSION,
  CacheTtl,
  clearCacheByPrefixUsing,
  clearCacheItemUsing,
  getCacheItemUsing,
  getCacheKey,
  setCacheItemUsing,
} from '@/frontend/lib/cache';

type MutableStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key'> & { length: number };

function createMockStorage(): { storage: MutableStorage; backing: Map<string, string> } {
	const backing = new Map<string, string>();
	const storage: MutableStorage = {
		getItem: (key: string) => (backing.has(key) ? (backing.get(key) as string) : null),
		setItem: (key: string, value: string) => {
			backing.set(key, value);
			storage.length = backing.size;
		},
		removeItem: (key: string) => {
			backing.delete(key);
			storage.length = backing.size;
		},
		key: (index: number) => Array.from(backing.keys())[index] ?? null,
		length: 0,
	};
	return { storage, backing };
}

describe('frontend/lib/cache', () => {
	const versionA = CACHE_VERSION;
	const versionB = `${Number(CACHE_VERSION) + 1}`;

	let nowSpy: jest.SpiedFunction<typeof Date.now>;

	beforeEach(() => {
		nowSpy = jest.spyOn(Date, 'now');
	});

	afterEach(() => {
		nowSpy.mockRestore();
	});

	test('getCacheKey builds namespaced keys', () => {
		const k = getCacheKey('players:player:123', versionA);
		expect(k).toBe('players:player:123:v' + versionA);
	});

	test('set/get without TTL returns value', () => {
		const { storage } = createMockStorage();
		nowSpy.mockReturnValue(1000);
		const key = getCacheKey('matches:match:42', versionA);
		setCacheItemUsing(storage, key, { id: 42 }, { version: versionA });
		const val = getCacheItemUsing<{ id: number }>(storage, key, { version: versionA });
		expect(val).toEqual({ id: 42 });
	});

	test('TTL respected: valid before expiry, null after expiry', () => {
		const { storage } = createMockStorage();
		const key = getCacheKey('teams:team:7', versionA);
		nowSpy.mockReturnValue(10_000);
		setCacheItemUsing(storage, key, { id: 7 }, { version: versionA, ttlMs: 1000 });

		// Before expiry
		nowSpy.mockReturnValue(10_500);
		let val = getCacheItemUsing<{ id: number }>(storage, key, { version: versionA, ttlMs: 1000 });
		expect(val).toEqual({ id: 7 });

		// After expiry
		nowSpy.mockReturnValue(11_100);
		val = getCacheItemUsing<{ id: number }>(storage, key, { version: versionA, ttlMs: 1000 });
		expect(val).toBeNull();
	});

	test('version mismatch invalidates entry', () => {
		const { storage } = createMockStorage();
		nowSpy.mockReturnValue(1);
		const key = getCacheKey('players:player:9', versionA);
		setCacheItemUsing(storage, key, { id: 9 }, { version: versionA, ttlMs: CacheTtl.players });
		const val = getCacheItemUsing<{ id: number }>(storage, key, { version: versionB, ttlMs: CacheTtl.players });
		expect(val).toBeNull();
	});

	test('clearCacheItemUsing removes specific key', () => {
		const { storage, backing } = createMockStorage();
		const k1 = getCacheKey('a:x', versionA);
		const k2 = getCacheKey('a:y', versionA);
		setCacheItemUsing(storage, k1, 1, { version: versionA });
		setCacheItemUsing(storage, k2, 2, { version: versionA });
		clearCacheItemUsing(storage, k1);
		expect(backing.has(k1)).toBe(false);
		expect(backing.has(k2)).toBe(true);
	});

	test('clearCacheByPrefixUsing removes all matching keys', () => {
		const { storage, backing } = createMockStorage();
		const k1 = getCacheKey('teams:team:1', versionA);
		const k2 = getCacheKey('teams:team:2', versionA);
		const k3 = getCacheKey('other:3', versionA);
		setCacheItemUsing(storage, k1, 1, { version: versionA });
		setCacheItemUsing(storage, k2, 2, { version: versionA });
		setCacheItemUsing(storage, k3, 3, { version: versionA });

		clearCacheByPrefixUsing(storage, 'teams:team:');
		expect(backing.has(k1)).toBe(false);
		expect(backing.has(k2)).toBe(false);
		expect(backing.has(k3)).toBe(true);
	});
});

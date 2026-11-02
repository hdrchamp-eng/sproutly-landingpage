import { afterEach, expect, it, vi } from 'vitest';
import { blockSchema, localStorageUrl, safeUrl } from '@/lib/model';
afterEach(() => vi.unstubAllEnvs());
it('allows images only from the configured loopback storage origin and bucket', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','http://127.0.0.1:27423');
  const url='http://127.0.0.1:27423/storage/v1/object/public/site-media/image.webp';
  expect(localStorageUrl(url)).toBe(true);
  expect(blockSchema.safeParse({type:'image',text:'Local image',url}).success).toBe(true);
  expect(blockSchema.safeParse({type:'link',text:'Link',url}).success).toBe(false);
  expect(localStorageUrl(url.replace('27423','12345'))).toBe(false);
  expect(localStorageUrl(url.replace('site-media','private'))).toBe(false);
  expect(localStorageUrl(url.replace('127.0.0.1','example.com'))).toBe(false);
  expect(safeUrl(url)).toBe(false);
});
it('does not allow loopback exceptions with a cloud configuration', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');
  expect(localStorageUrl('http://127.0.0.1/storage/v1/object/public/site-media/a.png')).toBe(false);
});

import path from 'path';
import { isValidUuid, safeResolvePath, assertWithinDirectory } from '../utils/pathGuard';

describe('pathGuard', () => {
  describe('isValidUuid', () => {
    it('accepts a valid v4 UUID', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('rejects an empty string', () => {
      expect(isValidUuid('')).toBe(false);
    });

    it('rejects a path traversal attempt disguised as an ID', () => {
      expect(isValidUuid('../etc/passwd')).toBe(false);
      expect(isValidUuid('../../secret')).toBe(false);
    });

    it('rejects a non-UUID string', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
    });
  });

  describe('safeResolvePath', () => {
    const base = '/tmp/outputs';

    it('resolves a safe filename within the base dir', () => {
      const result = safeResolvePath(base, 'file.pdf');
      expect(result).toBe(path.resolve(base, 'file.pdf'));
    });

    it('throws on path traversal via ../', () => {
      expect(() => safeResolvePath(base, '../etc/passwd')).toThrow('Path traversal');
    });

    it('throws on absolute path escaping base', () => {
      expect(() => safeResolvePath(base, '/etc/passwd')).toThrow('Path traversal');
    });
  });

  describe('assertWithinDirectory', () => {
    const base = '/tmp/uploads';

    it('does not throw for a path inside the base dir', () => {
      expect(() => assertWithinDirectory(base, `${base}/file.pdf`)).not.toThrow();
    });

    it('throws for a path outside the base dir', () => {
      expect(() => assertWithinDirectory(base, '/etc/passwd')).toThrow('Path traversal');
    });

    it('throws for a traversal path', () => {
      expect(() => assertWithinDirectory(base, `${base}/../secret`)).toThrow('Path traversal');
    });
  });
});

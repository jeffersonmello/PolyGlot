import path from 'path';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if the string is a valid UUID v4.
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Resolves a file path and verifies it stays within the allowed base directory.
 * Throws if the resolved path escapes the base directory (path traversal protection).
 */
export function safeResolvePath(baseDir: string, fileName: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(baseDir, fileName);

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Path traversal detected: ${fileName}`);
  }

  return resolvedTarget;
}

/**
 * Validates that a given absolute file path is contained within the expected
 * base directory. Throws if the path escapes the allowed directory.
 */
export function assertWithinDirectory(baseDir: string, absolutePath: string): void {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(absolutePath);

  if (!resolvedTarget.startsWith(resolvedBase + path.sep) && resolvedTarget !== resolvedBase) {
    throw new Error(`Path traversal detected for path: ${absolutePath}`);
  }
}

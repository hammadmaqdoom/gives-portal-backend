/**
 * Utility functions for URL construction and validation
 */

/**
 * Ensures a domain has a proper protocol (https://)
 * @param domain - The domain to check and fix
 * @returns The domain with proper protocol
 */
export function ensureProtocol(domain: string): string {
  if (!domain) {
    throw new Error('Domain is required');
  }

  // If domain already has a protocol, return as is
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain;
  }

  // Default to HTTPS for production domains
  return `https://${domain}`;
}

/**
 * Creates a URL with proper protocol handling
 * @param domain - The base domain
 * @param path - The path to append
 * @returns A properly formatted URL
 */
export function createUrl(domain: string, path: string = ''): URL {
  const fullDomain = ensureProtocol(domain);
  const fullPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(fullDomain + fullPath);
}

/**
 * Validates if a string is a valid URL
 * @param urlString - The string to validate
 * @returns True if valid URL, false otherwise
 */
export function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Utility functions for encoding and decoding UUIDs in URLs
 */

/**
 * Encodes a UUID to a URL-safe base64 string
 * @param uuid The UUID to encode (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * @returns Base64-encoded string safe for URLs (e.g., "VQ6EAOKbQdSnFkRmVUQAAA")
 */
export function encodeUuidForUrl(uuid: string): string {
  // Remove dashes from UUID
  const hex = uuid.replace(/-/g, '');
  
  // Convert hex to bytes
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  
  // Convert bytes to base64
  const binary = String.fromCharCode(...bytes);
  const base64 = btoa(binary);
  
  // Make it URL-safe by replacing +/ with -_ and removing padding
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a URL-safe base64 string back to a UUID
 * @param encoded The base64-encoded string (e.g., "VQ6EAOKbQdSnFkRmVUQAAA")
 * @returns The original UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function decodeUuidFromUrl(encoded: string): string {
  // Restore standard base64 characters
  let base64 = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  // Decode base64 to binary
  const binary = atob(base64);
  
  // Convert binary to hex
  let hex = '';
  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i).toString(16).padStart(2, '0');
    hex += byte;
  }
  
  // Format as UUID (8-4-4-4-12)
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}

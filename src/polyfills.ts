/**
 * Polyfill for SlowBuffer to support Node.js v25+
 * SlowBuffer was deprecated and removed in newer Node.js versions
 * This polyfill provides compatibility for packages like buffer-equal-constant-time
 *
 * This must be loaded BEFORE any modules that use buffer-equal-constant-time
 */
import { Buffer } from 'buffer';

// Polyfill SlowBuffer for compatibility with older packages
// This needs to be set on both global and the buffer module
if (typeof (global as any).SlowBuffer === 'undefined') {
  // Create SlowBuffer as an alias to Buffer
  // Use function constructor to avoid TypeScript spread issues
  const SlowBuffer = Buffer as any;

  // Add prototype methods that buffer-equal-constant-time expects
  // The old SlowBuffer.prototype.equal method
  if (!(SlowBuffer.prototype as any).equal) {
    (SlowBuffer.prototype as any).equal = Buffer.prototype.equals;
  }

  // Set on global
  (global as any).SlowBuffer = SlowBuffer;

  // Also patch the buffer module
  try {
    const bufferModule = require('buffer');
    if (bufferModule) {
      bufferModule.SlowBuffer = SlowBuffer;
      // Ensure it's also available as a property
      Object.defineProperty(bufferModule, 'SlowBuffer', {
        value: SlowBuffer,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  } catch (e) {
    // Ignore if buffer module can't be required
  }

  // Patch require.cache if buffer module is already cached
  const bufferModulePath = require.resolve('buffer');
  if (require.cache[bufferModulePath]) {
    const cachedBuffer = require.cache[bufferModulePath];
    if (cachedBuffer && cachedBuffer.exports) {
      cachedBuffer.exports.SlowBuffer = SlowBuffer;
    }
  }
}

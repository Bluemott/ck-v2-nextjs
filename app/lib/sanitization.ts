import DOMPurify from 'isomorphic-dompurify';

/**
 * Comprehensive Input Sanitization Module
 *
 * This module provides sanitization functions for HTML, text, and URLs
 * to prevent XSS attacks and ensure data integrity.
 *
 * Features:
 * - HTML sanitization with DOMPurify
 * - Text sanitization for plain text
 * - URL validation and sanitization
 * - Configurable allowed tags and attributes
 * - Comprehensive security measures
 */

// Allowed HTML tags for sanitization
const ALLOWED_HTML_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'b',
  'i',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'a',
  'img',
  'blockquote',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'div',
  'span',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'aside',
  'main',
  'figure',
  'figcaption',
];

// Allowed HTML attributes for sanitization
const ALLOWED_HTML_ATTRIBUTES = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'width',
  'height',
  'target',
  'rel',
  'type',
  'data-src',
  'data-alt',
  'data-title',
  'aria-label',
  'aria-describedby',
  'aria-hidden',
  'role',
  'tabindex',
  'download',
];

// DOMPurify configuration for enhanced security
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ALLOWED_HTML_TAGS,
  ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_TAGS: [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'textarea',
    'select',
    'button',
  ],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
  ],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false,
  SANITIZE_NAMED_PROPS: false,
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitizes HTML content using DOMPurify
 *
 * @param html - The HTML string to sanitize
 * @param options - Optional configuration overrides
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  html: string,
  options?: Partial<typeof DOMPURIFY_CONFIG>
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const config = { ...DOMPURIFY_CONFIG, ...options };
    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.error('HTML sanitization error:', error);
    // Return empty string on error for security
    return '';
  }
}

/**
 * Sanitizes plain text content
 *
 * @param text - The text string to sanitize
 * @param options - Optional sanitization options
 * @returns Sanitized text string
 */
export function sanitizeText(
  text: string,
  options?: {
    removeHTML?: boolean;
    removeScripts?: boolean;
    maxLength?: number;
    allowNewlines?: boolean;
  }
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const {
    removeHTML = true,
    removeScripts = true,
    maxLength = 10000,
    allowNewlines = true,
  } = options || {};

  let sanitized = text;

  // Remove HTML tags if requested
  if (removeHTML) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove script-related content
  if (removeScripts) {
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '');
  }

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/\r?\n/g, ' ').replace(/\r/g, ' ');
  }

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * Sanitizes and validates URLs
 *
 * @param url - The URL string to sanitize
 * @param options - Optional validation options
 * @returns Sanitized URL string or empty string if invalid
 */
export function sanitizeURL(
  url: string,
  options?: {
    allowedProtocols?: string[];
    requireProtocol?: boolean;
    allowRelative?: boolean;
    maxLength?: number;
  }
): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const {
    allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'],
    requireProtocol = false,
    allowRelative = false,
    maxLength = 2048,
  } = options || {};

  try {
    // Trim whitespace
    let sanitized = url.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Add protocol if required and missing
    if (requireProtocol && !sanitized.match(/^[a-zA-Z]+:/)) {
      sanitized = `https://${sanitized}`;
    }

    // Parse URL
    const parsed = new URL(
      sanitized,
      allowRelative ? 'https://example.com' : undefined
    );

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }

    // For relative URLs, return the path
    if (
      allowRelative &&
      parsed.protocol === 'https:' &&
      parsed.hostname === 'example.com'
    ) {
      return parsed.pathname + parsed.search + parsed.hash;
    }

    // Return full URL for absolute URLs
    return parsed.toString();
  } catch (error) {
    console.error('URL sanitization error:', error);
    return '';
  }
}

/**
 * Sanitizes email addresses
 *
 * @param email - The email string to sanitize
 * @returns Sanitized email string or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const sanitized = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitizes file names for safe storage
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid characters
    .replace(/\.\./g, '_') // Prevent directory traversal
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Sanitizes search queries
 *
 * @param query - The search query to sanitize
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  return sanitizeText(query, {
    removeHTML: true,
    removeScripts: true,
    maxLength: 500,
    allowNewlines: false,
  });
}

/**
 * Sanitizes form data object
 *
 * @param data - The form data object to sanitize
 * @returns Sanitized form data object
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Sanitizes blog post content specifically
 *
 * @param content - The blog post content to sanitize
 * @returns Sanitized blog post content
 */
export function sanitizeBlogPostContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Use more permissive HTML sanitization for blog content
  const blogPostConfig = {
    ...DOMPURIFY_CONFIG,
    ALLOWED_TAGS: [
      ...ALLOWED_HTML_TAGS,
      'blockquote',
      'pre',
      'code',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: [...ALLOWED_HTML_ATTRIBUTES, 'style', 'data-*'],
    KEEP_CONTENT: true,
  };

  return sanitizeHTML(content, blogPostConfig);
}

/**
 * Sanitizes excerpt text
 *
 * @param excerpt - The excerpt text to sanitize
 * @returns Sanitized excerpt text
 */
export function sanitizeExcerpt(excerpt: string): string {
  if (!excerpt || typeof excerpt !== 'string') {
    return '';
  }

  // Remove HTML tags and limit length for excerpts
  return sanitizeText(excerpt, {
    removeHTML: true,
    removeScripts: true,
    maxLength: 300,
    allowNewlines: false,
  });
}

/**
 * Sanitizes title text
 *
 * @param title - The title text to sanitize
 * @returns Sanitized title text
 */
export function sanitizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return sanitizeText(title, {
    removeHTML: true,
    removeScripts: true,
    maxLength: 200,
    allowNewlines: false,
  });
}

// Export types for TypeScript support
export type SanitizationOptions = {
  removeHTML?: boolean;
  removeScripts?: boolean;
  maxLength?: number;
  allowNewlines?: boolean;
};

export type URLSanitizationOptions = {
  allowedProtocols?: string[];
  requireProtocol?: boolean;
  allowRelative?: boolean;
  maxLength?: number;
};

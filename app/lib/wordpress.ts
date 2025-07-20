// WordPress API Integration for Headless CMS
// This file handles all communication with the WordPress REST API

export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  meta: Record<string, unknown>[];
  _links: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    author: Array<{ embeddable: boolean; href: string }>;
    replies: Array<{ embeddable: boolean; href: string }>;
    'version-history': Array<{ count: number; href: string }>;
    'predecessor-version': Array<{ id: number; href: string }>;
    'wp:featuredmedia': Array<{ embeddable: boolean; href: string }>;
    'wp:attachment': Array<{ href: string }>;
    'wp:term': Array<{ taxonomy: string; embeddable: boolean; href: string }>;
    curies: Array<{ name: string; href: string; templated: boolean }>;
  };
}

export interface WordPressMedia {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: Record<string, unknown>[];
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    filesize: number;
    sizes: {
      thumbnail: {
        file: string;
        width: number;
        height: number;
        filesize: number;
        mime_type: string;
        source_url: string;
      };
      medium: {
        file: string;
        width: number;
        height: number;
        filesize: number;
        mime_type: string;
        source_url: string;
      };
      large: {
        file: string;
        width: number;
        height: number;
        filesize: number;
        mime_type: string;
        source_url: string;
      };
      full: {
        file: string;
        width: number;
        height: number;
        filesize: number;
        mime_type: string;
        source_url: string;
      };
    };
    image_meta: {
      aperture: string;
      credit: string;
      camera: string;
      caption: string;
      created_timestamp: string;
      copyright: string;
      focal_length: string;
      iso: string;
      shutter_speed: string;
      title: string;
      orientation: string;
      keywords: string[];
    };
  };
  post: number;
  source_url: string;
  _links: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    author: Array<{ embeddable: boolean; href: string }>;
    replies: Array<{ embeddable: boolean; href: string }>;
  };
}

export interface WordPressPage {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  parent: number;
  menu_order: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: Record<string, unknown>[];
  _links: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    author: Array<{ embeddable: boolean; href: string }>;
    replies: Array<{ embeddable: boolean; href: string }>;
    'version-history': Array<{ count: number; href: string }>;
    'predecessor-version': Array<{ id: number; href: string }>;
    'wp:featuredmedia': Array<{ embeddable: boolean; href: string }>;
    'wp:attachment': Array<{ href: string }>;
    curies: Array<{ name: string; href: string; templated: boolean }>;
  };
}

// WordPress API Configuration
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.cowboykimono.com/wp-json/wp/v2';

// Utility function to decode HTML entities
export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Fetch posts from WordPress API
export async function fetchPosts(params?: {
  per_page?: number;
  page?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
}): Promise<WordPressPost[]> {
  const url = new URL(WORDPRESS_API_URL + '/posts');
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts: WordPressPost[] = await response.json();
    return posts.map(post => ({
      ...post,
      title: {
        ...post.title,
        rendered: decodeHtmlEntities(post.title.rendered)
      },
      excerpt: {
        ...post.excerpt,
        rendered: decodeHtmlEntities(post.excerpt.rendered)
      }
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Fetch a single post by slug
export async function fetchPostBySlug(slug: string): Promise<WordPressPost | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/posts?slug=${slug}&_embed`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts: WordPressPost[] = await response.json();
    
    if (posts.length === 0) {
      return null;
    }

    const post = posts[0];
    return {
      ...post,
      title: {
        ...post.title,
        rendered: decodeHtmlEntities(post.title.rendered)
      },
      excerpt: {
        ...post.excerpt,
        rendered: decodeHtmlEntities(post.excerpt.rendered)
      }
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Fetch pages from WordPress API
export async function fetchPages(params?: {
  per_page?: number;
  page?: number;
  slug?: string;
}): Promise<WordPressPage[]> {
  const url = new URL(WORDPRESS_API_URL + '/pages');
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pages: WordPressPage[] = await response.json();
    return pages.map(page => ({
      ...page,
      title: {
        ...page.title,
        rendered: decodeHtmlEntities(page.title.rendered)
      },
      excerpt: {
        ...page.excerpt,
        rendered: decodeHtmlEntities(page.excerpt.rendered)
      }
    }));
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

// Fetch media by ID
export async function fetchMedia(mediaId: number): Promise<WordPressMedia | null> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL}/media/${mediaId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const media: WordPressMedia = await response.json();
    return media;
  } catch (error) {
    console.error('Error fetching media:', error);
    return null;
  }
}

// Fetch categories
export async function fetchCategories(): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL.replace('/wp/v2', '')}/wp/v2/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Fetch tags
export async function fetchTags(): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_URL.replace('/wp/v2', '')}/wp/v2/tags`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
} 
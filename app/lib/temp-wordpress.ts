// Temporary WordPress data loader for development
// This uses the local export files until the Aurora migration is complete

export interface TempWordPressPost {
  id: string;
  databaseId: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  };
  featuredImage: {
    id: string;
    sourceUrl: string;
    altText: string | null;
  } | null;
  categories: TempWordPressCategory[];
  tags: TempWordPressTag[];
}

export interface TempWordPressCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

export interface TempWordPressTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number;
}

// Sample data for development (you can replace this with your actual export data)
const samplePosts: TempWordPressPost[] = [
  {
    id: 'temp-1',
    databaseId: 1,
    date: '2025-01-15T10:00:00Z',
    modified: '2025-01-15T10:00:00Z',
    slug: '1970s-green-velvet-skirt',
    status: 'publish',
    title: '1970s Green Velvet Skirt',
    content: '<p>This is a sample blog post about a 1970s green velvet skirt. The content would be much longer in a real post.</p>',
    excerpt: 'A beautiful vintage find from the 1970s...',
    author: {
      id: 'temp-author-1',
      name: 'Cowboy Kimono',
      slug: 'cowboy-kimono',
      avatar: null,
    },
    featuredImage: {
      id: 'temp-media-1',
      sourceUrl: 'https://via.placeholder.com/800x600/90EE90/000000?text=Green+Velvet+Skirt',
      altText: '1970s Green Velvet Skirt',
    },
    categories: [
      {
        id: 'temp-cat-1',
        name: 'Vintage Fashion',
        slug: 'vintage-fashion',
        description: 'Vintage fashion finds and styling tips',
        count: 1,
      }
    ],
    tags: [
      {
        id: 'temp-tag-1',
        name: '1970s',
        slug: '1970s',
        description: 'Fashion from the 1970s',
        count: 1,
      },
      {
        id: 'temp-tag-2',
        name: 'Velvet',
        slug: 'velvet',
        description: 'Velvet clothing and accessories',
        count: 1,
      }
    ],
  },
  {
    id: 'temp-2',
    databaseId: 2,
    date: '2025-01-10T10:00:00Z',
    modified: '2025-01-10T10:00:00Z',
    slug: 'cowboy-kimono-design',
    status: 'publish',
    title: 'The Art of Cowboy Kimono Design',
    content: '<p>Exploring the unique fusion of western and eastern aesthetics in our signature cowboy kimono designs.</p>',
    excerpt: 'Discover how we blend western and eastern aesthetics...',
    author: {
      id: 'temp-author-1',
      name: 'Cowboy Kimono',
      slug: 'cowboy-kimono',
      avatar: null,
    },
    featuredImage: {
      id: 'temp-media-2',
      sourceUrl: 'https://via.placeholder.com/800x600/FFB6C1/000000?text=Cowboy+Kimono+Design',
      altText: 'Cowboy Kimono Design',
    },
    categories: [
      {
        id: 'temp-cat-2',
        name: 'Design',
        slug: 'design',
        description: 'Design inspiration and process',
        count: 1,
      }
    ],
    tags: [
      {
        id: 'temp-tag-3',
        name: 'Design',
        slug: 'design',
        description: 'Design and creativity',
        count: 1,
      },
      {
        id: 'temp-tag-4',
        name: 'Kimono',
        slug: 'kimono',
        description: 'Kimono fashion and culture',
        count: 1,
      }
    ],
  },
  {
    id: 'temp-3',
    databaseId: 3,
    date: '2025-01-05T10:00:00Z',
    modified: '2025-01-05T10:00:00Z',
    slug: 'western-fashion-trends',
    status: 'publish',
    title: 'Western Fashion Trends 2025',
    content: '<p>Exploring the latest trends in western fashion and how they influence our designs.</p>',
    excerpt: 'Stay ahead of the curve with these western fashion trends...',
    author: {
      id: 'temp-author-1',
      name: 'Cowboy Kimono',
      slug: 'cowboy-kimono',
      avatar: null,
    },
    featuredImage: {
      id: 'temp-media-3',
      sourceUrl: 'https://via.placeholder.com/800x600/87CEEB/000000?text=Western+Fashion+Trends',
      altText: 'Western Fashion Trends',
    },
    categories: [
      {
        id: 'temp-cat-3',
        name: 'Fashion Trends',
        slug: 'fashion-trends',
        description: 'Latest fashion trends and insights',
        count: 1,
      }
    ],
    tags: [
      {
        id: 'temp-tag-5',
        name: 'Trends',
        slug: 'trends',
        description: 'Fashion trends and predictions',
        count: 1,
      },
      {
        id: 'temp-tag-6',
        name: 'Western',
        slug: 'western',
        description: 'Western fashion and style',
        count: 1,
      }
    ],
  }
];

const sampleCategories: TempWordPressCategory[] = [
  {
    id: 'temp-cat-1',
    name: 'Vintage Fashion',
    slug: 'vintage-fashion',
    description: 'Vintage fashion finds and styling tips',
    count: 1,
  },
  {
    id: 'temp-cat-2',
    name: 'Design',
    slug: 'design',
    description: 'Design inspiration and process',
    count: 1,
  },
  {
    id: 'temp-cat-3',
    name: 'Fashion Trends',
    slug: 'fashion-trends',
    description: 'Latest fashion trends and insights',
    count: 1,
  }
];

const sampleTags: TempWordPressTag[] = [
  {
    id: 'temp-tag-1',
    name: '1970s',
    slug: '1970s',
    description: 'Fashion from the 1970s',
    count: 1,
  },
  {
    id: 'temp-tag-2',
    name: 'Velvet',
    slug: 'velvet',
    description: 'Velvet clothing and accessories',
    count: 1,
  },
  {
    id: 'temp-tag-3',
    name: 'Design',
    slug: 'design',
    description: 'Design and creativity',
    count: 1,
  },
  {
    id: 'temp-tag-4',
    name: 'Kimono',
    slug: 'kimono',
    description: 'Kimono fashion and culture',
    count: 1,
  },
  {
    id: 'temp-tag-5',
    name: 'Trends',
    slug: 'trends',
    description: 'Fashion trends and predictions',
    count: 1,
  },
  {
    id: 'temp-tag-6',
    name: 'Western',
    slug: 'western',
    description: 'Western fashion and style',
    count: 1,
  }
];

export async function fetchPosts(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<TempWordPressPost[]> {
  let filteredPosts = samplePosts.filter(post => post.status === 'publish');
  
  // Apply filters
  if (params?.categoryName) {
    filteredPosts = filteredPosts.filter(post => 
      post.categories.some(cat => cat.slug === params.categoryName)
    );
  }
  
  if (params?.tagName) {
    filteredPosts = filteredPosts.filter(post => 
      post.tags.some(tag => tag.slug === params.tagName)
    );
  }
  
  if (params?.search) {
    const searchTerm = params.search.toLowerCase();
    filteredPosts = filteredPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply pagination
  const first = params?.first || 10;
  const startIndex = 0; // Simple pagination for now
  return filteredPosts.slice(startIndex, startIndex + first);
}

export async function fetchPostBySlug(slug: string): Promise<TempWordPressPost | null> {
  const post = samplePosts.find(p => p.slug === slug && p.status === 'publish');
  return post || null;
}

export async function fetchCategories(): Promise<TempWordPressCategory[]> {
  return sampleCategories;
}

export async function fetchTags(): Promise<TempWordPressTag[]> {
  return sampleTags;
}

export async function fetchPostsWithPagination(params?: {
  first?: number;
  after?: string;
  categoryName?: string;
  tagName?: string;
  search?: string;
}): Promise<{
  posts: TempWordPressPost[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}> {
  const posts = await fetchPosts(params);
  const totalCount = samplePosts.filter(post => post.status === 'publish').length;
  
  return {
    posts,
    pageInfo: {
      hasNextPage: false, // Simple implementation
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    totalCount,
  };
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function getFeaturedImageUrl(post: TempWordPressPost): string | null {
  return post.featuredImage?.sourceUrl || null;
}

export function getFeaturedImageAlt(post: TempWordPressPost): string {
  return post.featuredImage?.altText || '';
}

// Additional functions that the API layer expects
export async function fetchCategoryBySlug(slug: string): Promise<TempWordPressCategory | null> {
  const category = sampleCategories.find(cat => cat.slug === slug);
  return category || null;
}

export async function fetchTagBySlug(slug: string): Promise<TempWordPressTag | null> {
  const tag = sampleTags.find(tag => tag.slug === slug);
  return tag || null;
}

export async function fetchAdjacentPosts(slug: string): Promise<{
  previousPost: TempWordPressPost | null;
  nextPost: TempWordPressPost | null;
}> {
  const currentIndex = samplePosts.findIndex(post => post.slug === slug);
  
  if (currentIndex === -1) {
    return { previousPost: null, nextPost: null };
  }
  
  const previousPost = currentIndex < samplePosts.length - 1 ? (samplePosts[currentIndex + 1] || null) : null;
  const nextPost = currentIndex > 0 ? (samplePosts[currentIndex - 1] || null) : null;
  
  return { previousPost, nextPost };
}

export async function fetchRelatedPosts(currentPost: TempWordPressPost, limit: number = 3): Promise<TempWordPressPost[]> {
  // Simple implementation - return other posts excluding the current one
  return samplePosts
    .filter(post => post.id !== currentPost.id && post.status === 'publish')
    .slice(0, limit);
} 
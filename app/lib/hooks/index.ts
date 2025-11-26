/**
 * SWR-based data fetching hooks for WordPress API
 * 
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Background revalidation (stale-while-revalidate)
 * - Error retry with exponential backoff
 * - Request deduplication
 * - Focus/reconnect revalidation
 * 
 * Usage:
 * ```tsx
 * import { usePosts, useCategories, useTags } from '@/app/lib/hooks';
 * 
 * function MyComponent() {
 *   const { posts, isLoading, error } = usePosts({ page: 1, perPage: 10 });
 *   const { categories } = useCategories();
 *   const { tags } = useTags();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return <div>{posts.map(post => ...)}</div>;
 * }
 * ```
 */

// Posts hooks
export {
  usePosts,
  useInfinitePosts,
  usePost,
  useSearchPosts,
  type PostsResponse,
  type UsePostsOptions,
} from './usePosts';

// Downloads hooks
export {
  useDownloads,
  useDownloadsByCategory,
  useFeaturedDownloads,
  useDownload,
  useDownloadCategories,
  type DownloadsResponse,
  type UseDownloadsOptions,
} from './useDownloads';

// Categories hooks
export {
  useCategories,
  useCategoryBySlug,
  usePopularCategories,
} from './useCategories';

// Tags hooks
export {
  useTags,
  useTagBySlug,
  usePopularTags,
  useTagsWithMinPosts,
} from './useTags';


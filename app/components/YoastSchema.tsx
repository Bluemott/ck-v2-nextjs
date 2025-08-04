import { BlogPost } from '../lib/api';

interface YoastSchemaProps {
  post: BlogPost;
}

export default function YoastSchema({ post }: YoastSchemaProps) {
  // Check if post has SEO data in _embedded
  const seoData = post._embedded?.['yoast-seo']?.[0];
  if (!seoData?.schema?.raw) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: seoData.schema.raw,
      }}
    />
  );
} 
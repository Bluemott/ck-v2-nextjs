import { BlogPost } from '../lib/api';

interface YoastSchemaProps {
  post: BlogPost;
}

export default function YoastSchema({ post }: YoastSchemaProps) {
  if (!post.seo?.schema?.raw) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: post.seo.schema.raw,
      }}
    />
  );
} 
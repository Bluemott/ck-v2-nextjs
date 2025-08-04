import Script from 'next/script';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Article' | 'Product' | 'BlogPosting';
  data: Record<string, unknown>;
}

// Organization structured data
export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cowboy Kimono',
  description: 'Handcrafted Western-inspired robes and apparel blending Western and Eastern aesthetics.',
      url: 'https://www.cowboykimono.com',
    logo: 'https://www.cowboykimono.com/images/CK_Logo_Title-01.webp',
    image: 'https://www.cowboykimono.com/images/CK_New_Hero_Red_Head-1.webp',
  sameAs: [
    'https://www.instagram.com/cowboykimono',
    'https://www.facebook.com/me.marisa.mott',
    'https://www.etsy.com/shop/CowboyKimono'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'English'
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US'
  }
};

// Website structured data
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Cowboy Kimono',
  url: 'https://www.cowboykimono.com',
  description: 'Handcrafted Western-inspired robes and apparel',
  publisher: {
    '@type': 'Organization',
    name: 'Cowboy Kimono'
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.cowboykimono.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

// Blog structured data
export const blogStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Cowboy Kimono Blog',
  description: 'Stories, inspiration, and insights from the world of Cowboy Kimono',
  url: 'https://www.cowboykimono.com/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Cowboy Kimono',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.cowboykimono.com/images/CK_Logo_Title-01.webp'
    }
  }
};

interface ArticleStructuredDataProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}

export function generateArticleStructuredData({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author = 'Cowboy Kimono'
}: ArticleStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    image: image || 'https://www.cowboykimono.com/images/CK_New_Hero_Red_Head-1.webp',
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://www.cowboykimono.com'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cowboy Kimono',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cowboykimono.com/images/CK_Logo_Title-01.webp'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  };
}

const StructuredData = ({ type, data }: StructuredDataProps) => {
  return (
    <Script
      id={`structured-data-${type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
};

export default StructuredData;

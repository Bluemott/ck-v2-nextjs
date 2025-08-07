import Script from 'next/script';

interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Article' | 'Product' | 'BlogPosting' | 'BreadcrumbList' | 'FAQPage';
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

// Breadcrumb structured data
export const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://cowboykimono.com',
    },
  ],
};

// FAQ structured data
export const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a cowboy kimono?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A cowboy kimono is a unique blend of Western and Eastern aesthetics, combining traditional kimono design with Western cowboy elements.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are your kimonos handmade?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all our kimonos are handcrafted with attention to detail and quality materials.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I care for my cowboy kimono?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We recommend hand washing in cold water with mild detergent and air drying to preserve the quality and longevity of your kimono.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer custom sizing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer custom sizing for most of our pieces. Please contact us for custom orders and measurements.',
      },
    },
    {
      '@type': 'Question',
      name: 'What materials do you use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use high-quality, natural materials including cotton, silk, and linen, carefully selected for comfort and durability.',
      },
    },
  ],
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

// Product structured data
export function generateProductStructuredData(product: {
  name: string;
  description: string;
  price: string;
  image: string;
  url: string;
  availability: 'InStock' | 'OutOfStock';
  sku?: string;
  brand?: string;
  category?: string;
  material?: string;
  color?: string;
  size?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    url: product.url,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Cowboy Kimono',
    },
    category: product.category,
    material: product.material,
    color: product.color,
    size: product.size,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: `https://schema.org/${product.availability}`,
      seller: {
        '@type': 'Organization',
        name: 'Cowboy Kimono',
        url: 'https://www.cowboykimono.com',
      },
    },
  };
}

// Enhanced breadcrumb generator
export function generateBreadcrumbStructuredData(items: Array<{
  name: string;
  url: string;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Enhanced FAQ generator
export function generateFAQStructuredData(faqs: Array<{
  question: string;
  answer: string;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
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

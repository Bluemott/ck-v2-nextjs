import Script from 'next/script';

interface StructuredDataProps {
  data: object | object[];
}

export default function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((item, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item, null, 0),
          }}
        />
      ))}
    </>
  );
}

// Breadcrumb structured data generator
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url,
    })),
  };
}

// Download structured data generator
export function generateDownloadStructuredData(download: {
  name: string;
  description: string;
  url: string;
  image: string;
  fileFormat: string;
  fileSize?: string;
  downloadUrl: string;
  category: string;
  difficulty?: string;
  timeEstimate?: string;
  materialsNeeded?: string;
}) {
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: download.name,
    description: download.description,
    url: download.url,
    image: download.image,
    fileFormat: download.fileFormat,
    downloadUrl: download.downloadUrl,
    about: {
      '@type': 'Thing',
      name: download.category.replace('-', ' '),
    },
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: {
      '@type': 'Organization',
      name: 'Cowboy Kimono',
      url: 'https://cowboykimono.com',
    },
  };

  // Add optional fields if they exist
  if (download.fileSize) {
    structuredData.fileSize = download.fileSize;
  }

  if (download.difficulty) {
    structuredData.difficulty = download.difficulty;
  }

  if (download.timeEstimate) {
    structuredData.timeRequired = download.timeEstimate;
  }

  if (download.materialsNeeded) {
    structuredData.material = download.materialsNeeded;
  }

  return structuredData;
}

// Download collection structured data generator
export function generateDownloadCollectionStructuredData(collection: {
  name: string;
  description: string;
  url: string;
  downloads: Array<{
    name: string;
    url: string;
    fileFormat: string;
    fileSize?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: collection.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: collection.downloads.length,
      itemListElement: collection.downloads.map((download, index) => ({
        '@type': 'DigitalDocument',
        position: index + 1,
        name: download.name,
        url: download.url,
        fileFormat: download.fileFormat,
        fileSize: download.fileSize,
        isAccessibleForFree: true,
      })),
    },
    isAccessibleForFree: true,
    creator: {
      '@type': 'Organization',
      name: 'Cowboy Kimono',
      url: 'https://cowboykimono.com',
    },
  };
}

// Organization structured data generator
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cowboy Kimono',
    url: 'https://cowboykimono.com',
    logo: 'https://cowboykimono.com/logo.png',
    description: 'Handcrafted western fashion and accessories',
    sameAs: [
      'https://www.instagram.com/cowboykimono',
      'https://www.facebook.com/cowboykimono',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@cowboykimono.com',
    },
  };
}

// Article structured data generator
export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  url: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified: string;
  category: string;
  tags: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: article.url,
    image: article.image,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cowboy Kimono',
      url: 'https://cowboykimono.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cowboykimono.com/logo.png',
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    about: {
      '@type': 'Thing',
      name: article.category,
    },
    keywords: article.tags.join(', '),
  };
}

// Blog structured data generator
export const blogStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Cowboy Kimono Blog',
  url: 'https://cowboykimono.com/blog',
  description: 'Western fashion tips, DIY tutorials, and lifestyle content',
  publisher: {
    '@type': 'Organization',
    name: 'Cowboy Kimono',
    url: 'https://cowboykimono.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://cowboykimono.com/logo.png',
    },
  },
  inLanguage: 'en-US',
  isAccessibleForFree: true,
};

// Website structured data generator
export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cowboy Kimono',
    url: 'https://cowboykimono.com',
    description: 'Handcrafted western fashion and accessories',
    publisher: {
      '@type': 'Organization',
      name: 'Cowboy Kimono',
      url: 'https://cowboykimono.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://cowboykimono.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Product structured data generator
export function generateProductStructuredData(product: {
  name: string;
  description: string;
  price: string;
  image: string;
  url: string;
  availability: string;
  sku: string;
  brand: string;
  category: string;
  material?: string;
  color?: string;
  size?: string;
  condition?: string;
  weight?: string;
  height?: string;
  width?: string;
  depth?: string;
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
      name: product.brand,
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: `https://schema.org/${product.availability}`,
      seller: {
        '@type': 'Organization',
        name: 'Cowboy Kimono',
        url: 'https://cowboykimono.com',
      },
    },
    additionalProperty: [
      ...(product.material
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Material',
              value: product.material,
            },
          ]
        : []),
      ...(product.color
        ? [{ '@type': 'PropertyValue', name: 'Color', value: product.color }]
        : []),
      ...(product.size
        ? [{ '@type': 'PropertyValue', name: 'Size', value: product.size }]
        : []),
      ...(product.condition
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Condition',
              value: product.condition,
            },
          ]
        : []),
      ...(product.weight
        ? [{ '@type': 'PropertyValue', name: 'Weight', value: product.weight }]
        : []),
      ...(product.height
        ? [{ '@type': 'PropertyValue', name: 'Height', value: product.height }]
        : []),
      ...(product.width
        ? [{ '@type': 'PropertyValue', name: 'Width', value: product.width }]
        : []),
      ...(product.depth
        ? [{ '@type': 'PropertyValue', name: 'Depth', value: product.depth }]
        : []),
    ],
  };
}

// FAQ structured data generator
export const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What makes Cowboy Kimono products unique?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each piece is handpainted with artistic designs that blend Western and Eastern aesthetics, making every item one-of-a-kind wearable art.',
      },
    },
    {
      '@type': 'Question',
      name: 'What materials are used in your products?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use premium recycled denim and high-quality fabric paints to ensure durability and vibrant colors that last.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I care for my handpainted denim jacket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Turn inside out, wash in cold water with mild detergent, and air dry. Avoid bleach and high heat to preserve the artwork.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer custom designs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes! We love creating custom pieces. Contact us to discuss your vision and we'll work together to bring it to life.",
      },
    },
    {
      '@type': 'Question',
      name: 'What sizes are available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our jackets are designed to fit sizes S-XL with a relaxed, comfortable fit. Each product listing includes detailed measurements.',
      },
    },
  ],
};

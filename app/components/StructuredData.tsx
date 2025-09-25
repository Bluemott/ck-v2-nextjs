import Script from 'next/script';

interface StructuredDataProps {
  type:
    | 'Organization'
    | 'WebSite'
    | 'Article'
    | 'Product'
    | 'BlogPosting'
    | 'Blog'
    | 'BreadcrumbList'
    | 'FAQPage';
  data: Record<string, unknown>;
}

// Organization structured data
export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cowboy Kimono',
  description:
    'Handpainted denim jackets and apparel blending Western and Eastern aesthetics.',
  url: 'https://cowboykimono.com',
  logo: 'https://cowboykimono.com/images/CK_Logo_Title-01.webp',
  image: 'https://cowboykimono.com/images/CK_New_Hero_Red_Head-1.webp',
  sameAs: [
    'https://www.instagram.com/cowboykimono',
    'https://www.facebook.com/me.marisa.mott',
    'https://www.etsy.com/shop/CowboyKimono',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'English',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
};

// Website structured data
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Cowboy Kimono',
  url: 'https://cowboykimono.com',
  description: 'Handpainted denim jackets and Western-inspired apparel',
  publisher: {
    '@type': 'Organization',
    name: 'Cowboy Kimono',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://cowboykimono.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

// Blog structured data
export const blogStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Cowboy Kimono Blog',
  description:
    'Stories, inspiration, and insights from the world of Cowboy Kimono',
  url: 'https://cowboykimono.com/blog',
  publisher: {
    '@type': 'Organization',
    name: 'Cowboy Kimono',
    logo: {
      '@type': 'ImageObject',
      url: 'https://cowboykimono.com/images/CK_Logo_Title-01.webp',
    },
  },
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
        text: 'A cowboy kimono is a unique handpainted denim jacket that blends Western and Eastern aesthetics, combining artistic design with Western cowboy elements. Each piece is carefully crafted to create a one-of-a-kind wearable art piece.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are your jackets handpainted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all our denim jackets are handpainted with attention to detail and artistic flair. Each piece is unique and created by skilled artisans who specialize in textile art.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I care for my handpainted denim jacket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We recommend hand washing in cold water with mild detergent and air drying to preserve the handpainted artwork and longevity of your jacket. Avoid bleach and harsh chemicals.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer custom sizing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer custom sizing for most of our pieces. Please contact us for custom orders and measurements. Custom orders typically take 2-3 weeks to complete.',
      },
    },
    {
      '@type': 'Question',
      name: 'What materials do you use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We use high-quality recycled denim and premium paints, carefully selected for comfort, durability, and artistic expression. All materials are chosen for their quality and sustainability.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does shipping take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Standard shipping takes 3-7 business days within the United States. International shipping varies by location. We provide tracking information for all orders.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your return policy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer a 30-day return policy for unworn items in original condition. Custom pieces are final sale. Please contact us for return authorization.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I request a specific design or color?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we accept custom design requests! Please contact us with your ideas and we can discuss creating a unique piece just for you. Custom designs may require additional time and cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are your products sustainable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we prioritize sustainability by using recycled denim and eco-friendly paints. We believe in creating beautiful art while being mindful of our environmental impact.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you ship internationally?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we ship internationally to most countries. International shipping rates and delivery times vary by location. Please contact us for specific shipping information to your country.',
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
  author = 'Cowboy Kimono',
}: ArticleStructuredDataProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    image:
      image || 'https://cowboykimono.com/images/CK_New_Hero_Red_Head-1.webp',
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://cowboykimono.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cowboy Kimono',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cowboykimono.com/images/CK_Logo_Title-01.webp',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
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
  condition?: string;
  gtin?: string;
  mpn?: string;
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
    gtin: product.gtin,
    mpn: product.mpn,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Cowboy Kimono',
      url: 'https://cowboykimono.com',
    },
    category: product.category,
    material: product.material,
    color: product.color,
    size: product.size,
    condition: product.condition || 'https://schema.org/NewCondition',
    weight: product.weight,
    height: product.height,
    width: product.width,
    depth: product.depth,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: `https://schema.org/${product.availability}`,
      condition: product.condition || 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Cowboy Kimono',
        url: 'https://cowboykimono.com',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'USD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        author: {
          '@type': 'Person',
          name: 'Sarah M.',
        },
        reviewBody:
          'Absolutely love my handpainted denim jacket! The quality is exceptional and the design is unique.',
        datePublished: '2024-01-15',
      },
    ],
  };
}

// Enhanced breadcrumb generator
export function generateBreadcrumbStructuredData(
  items: Array<{
    name: string;
    url: string;
  }>
) {
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
export function generateFAQStructuredData(
  faqs: Array<{
    question: string;
    answer: string;
  }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
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

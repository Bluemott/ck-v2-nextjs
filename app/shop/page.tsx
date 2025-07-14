'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface EtsyProduct {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  image?: string;
  price?: string;
}

// Utility to decode HTML entities
function decodeHTMLEntities(text: string) {
  if (typeof window === 'undefined') return text;
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
}

const ShopPage = () => {
  const [products, setProducts] = useState<EtsyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace 'YourShopName' with the actual Etsy shop name
  const ETSY_SHOP_NAME = 'CowboyKimono'; // Update this with your actual shop name
  const RSS_URL = `https://www.etsy.com/shop/${ETSY_SHOP_NAME}/rss`;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // We'll use a CORS proxy since Etsy RSS doesn't allow direct browser access
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const rssText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssText, 'text/xml');
        
        const items = xmlDoc.querySelectorAll('item');
        const parsedProducts: EtsyProduct[] = [];

        items.forEach((item) => {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const guid = item.querySelector('guid')?.textContent || '';
          
          // Extract image from description (Etsy includes images in CDATA)
          const imageMatch = description.match(/<img[^>]+src="([^"]+)"/);
          const image = imageMatch ? imageMatch[1] : '';
          
          // Extract price from title (usually in format "Title - $XX.XX")
          const priceMatch = title.match(/\$[\d,]+\.?\d*/);
          const price = priceMatch ? priceMatch[0] : '';

          parsedProducts.push({
            title: title.replace(/\s*-\s*\$[\d,]+\.?\d*/, ''), // Remove price from title
            link,
            description: description.replace(/<[^>]*>/g, ''), // Strip HTML
            pubDate,
            guid,
            image,
            price
          });
        });

        setProducts(parsedProducts);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [RSS_URL]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f8ff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#1e2939] text-white px-4 py-2 rounded hover:bg-[#2a3441] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/CK_Logo_Titles_Shop.png" // Update with your actual shop header image
              alt="Shop Header"
              width={400}
              height={100}
              className="max-w-full h-auto"
            />
          </div>
          <p className="text-gray-600 text-lg">
            Discover our unique collection of handcrafted items
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by our Etsy shop • {products.length} items available
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div key={product.guid || index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Product Image */}
                {product.image && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      width={400}
                      height={256}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                
                {/* Product Info */}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-900 line-clamp-2 leading-tight">
                    {decodeHTMLEntities(product.title)}
                  </h2>
                  
                  {product.price && (
                    <p className="text-2xl font-bold text-green-600 mb-3 text-center">
                      {product.price}
                    </p>
                  )}
                  
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {decodeHTMLEntities(product.description.substring(0, 150))}...
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {formatDate(product.pubDate)}
                    </span>
                    
                    <a 
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-[#1e2939] text-white px-4 py-2 rounded-md hover:bg-[#2a3441] transition-colors font-medium"
                    >
                      View on Etsy
                      <span className="ml-1">→</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Etsy Shop Link */}
        <div className="text-center mt-12">
          <a
            href={`https://www.etsy.com/shop/${ETSY_SHOP_NAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-[#1e2939] text-white px-6 py-3 rounded-lg hover:bg-[#2a3441] transition-colors font-medium text-lg"
          >
            Visit Our Etsy Shop
            <span className="ml-2">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;

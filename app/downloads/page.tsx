'use client';

import { useState } from 'react';
import Image from 'next/image';

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  image: string;
  thumbnails: {
    id: string;
    title: string;
    thumbnail: string;
    downloadUrl: string;
  }[];
}

const downloadSections: DownloadItem[] = [
  {
    id: 'patterns',
    title: 'Coloring Pages',
    description: 'Free downloadable coloring pages for creating your own western-inspired garments. Includes detailed instructions and sizing guides.',
    image: '/images/Neon_Coloring_Mock.jpg',
    thumbnails: [
      {
        id: 'pattern-1',
        title: 'ABQ Neon',
        thumbnail: '/images/Neon_Coloring_Mock.jpg',
        downloadUrl: '/downloads/coloring-pages/ABQ_Neon_W+Color.pdf'
      },
      {
        id: 'pattern-2',
        title: 'Cover My Back',
        thumbnail: '/images/CK_Coloring_Button.jpg',
        downloadUrl: '/downloads/coloring-pages/CK_Creativity_Exercise.pdf'
      }
    ]
  },
  {
    id: 'templates',
    title: 'Craft Templates',
    description: 'Artistic templates and stencils for painting and decorating your own cowboy kimonos. Perfect for customization projects.',
    image: '/images/CKCraft_Template2.jpg',
    thumbnails: [
      {
        id: 'template-1',
        title: '3 June Bugs Youll Love Immediately',
        thumbnail: '/images/Craft_June_Bug.jpg',
        downloadUrl: '/downloads/craft-templates/June_Bugs.pdf'
      },
      {
        id: 'template-2',
        title: 'Year of the OX Irresistible Paper Craft',
        thumbnail: '/images/Ox_book_corner.jpg',
        downloadUrl: '/downloads/craft-templates/Ox_Book_Corner.pdf'
      },
      {
        id: 'template-3',
        title: 'Create a Kickass Thank You for Your Mail Carrier',
        thumbnail: '/images/Kickass_Thanks_Envelope.jpg',
        downloadUrl: '/downloads/craft-templates/Kickass_Thank_You.pdf'
      },
      {
        id: 'template-4',
        title: 'Your Labor is Loved (Labor Day Craft)',
        thumbnail: '/images/Labor_is_Loved.jpg',
        downloadUrl: '/downloads/craft-templates/Labor_Day_Love.pdf'
      },
      {
        id: 'template-5',
        title: 'Yum. Fathers Day Craft',
        thumbnail: '/images/Father_Day_Muffins.jpg',
        downloadUrl: '/downloads/craft-templates/Fathers_Day_Craft.pdf'
      },
      {
        id: 'template-6',
        title: 'Jumbo Milagros for Mothers Day',
        thumbnail: '/images/Jumbo_Milagro.jpg', // Replace with actual image path
        downloadUrl: '/downloads/craft-templates/Milagro_Ornaments_w_instructions.pdf'
      },
      {
        id: 'template-7',
        title: 'Grocery Bag Bird Ornaments',
        thumbnail: '/images/Grocery_Bag_Birds_Green.jpg',
        downloadUrl: '/downloads/craft-templates/Grocery_Bag_Birds_with_instructions.pdf'
      }
    ]
  },
  {
    id: 'guides',
    title:'DIY Tutorials',
    description: 'Comprehensive guides on caring for your handcrafted pieces and styling tips for different occasions.',
    image: '/images/Jumbo_Milagro.jpg',
    thumbnails: [
      {
        id: 'guide-1',
        title: 'How to Create a Hip Jackalope Display',
        thumbnail: '/images/Jackalope_Glasses.jpg',
        downloadUrl: '/blog/hip-jackalope-display' // Blog post link
      },
      {
        id: 'guide-2',
        title: 'Paint a One-of-a-kind Sofa Table',
        thumbnail: '/images/Sofa_Table.jpg',
        downloadUrl: '/blog/paint-sofa-table' // Blog post link
      },
      {
        id: 'guide-3',
        title: 'Animated Chalk Art',
        thumbnail: '/images/Animated_Chalk_Art.jpg',
        downloadUrl: '/blog/animated-chalk-art' // Blog post link
      },
      {
        id: 'guide-4',
        title: 'Create Scary Silhouettes',
        thumbnail: '/images/Scary_Silhouette.jpg',
        downloadUrl: '/blog/scary-silhouettes' // Blog post link
      },
      {
        id: 'guide-5',
        title: 'How to Wash Painted Denim',
        thumbnail: '/images/CK_Wash_Painted_Denim.jpg',
        downloadUrl: '/downloads/DIY-tutorials/CK_Wash_Painted_Denim.pdf' // Actual download
      },
      {
        id: 'guide-6',
        title: 'Fabric Paint Saves Stained Pants',
        thumbnail: '/images/CK_Indigo_Pants.jpg',
        downloadUrl: '/blog/fabric-paint-stained-pants' // Blog post link
      },
      {
        id: 'guide-7',
        title: 'Hello, Christmas Star (How Long Has it Been?)',
        thumbnail: '/images/Christmas_Star_SM.jpg',
        downloadUrl: '/blog/christmas-star' // Blog post link
      },
      {
        id: 'guide-8',
        title: 'Cactus Patch Mail Art',
        thumbnail: '/images/Cactus_Doodles118.jpg',
        downloadUrl: '/blog/cactus-patch-mail-art' // Blog post link
      },
    ]
  }
];

const DownloadsPage = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleDownload = (downloadUrl: string, title: string) => {
    // Check if it's a blog post link or actual download
    if (downloadUrl.startsWith('/blog/')) {
      // Navigate to blog post
      window.location.href = downloadUrl;
    } else {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f8ff] py-12">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/CK_Logo_Titles_Take-And-Make.png"
              alt="Take & Make"
              width={400}
              height={100}
              className="max-w-full h-auto"
            />
          </div>
          <p className="text-gray-600 text-lg">
            Free resources, patterns, and guides to enhance your cowboy kimono experience
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {downloadSections.length} categories available • Click cards to explore downloads
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {downloadSections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Main Card with Image and Overlay - Square Aspect Ratio */}
              <div
                className="cursor-pointer relative w-full overflow-hidden"
                style={{ width: '100%', height: 300, background: '#eee' }}
                onClick={() => toggleCard(section.id)}
              >
                <Image
                  src={section.image}
                  alt={section.title + ' preview'}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
                {/* Dark Overlay - Only visible on hover, using inline styles for reliable opacity */}
                <div
                  className="absolute inset-0 transition-all duration-300"
                  style={{ background: 'rgba(0,0,0,0)', transition: 'background 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
                />
                {/* Text Content Overlay - Only visible on hover */}
                <div
                  className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ zIndex: 10 }}
                >
                  {/* Add a semi-transparent background behind the text for readability */}
                  <div className="inline-block px-6 py-4 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg text-center">
                      {section.title}
                    </h2>
                    <p className="text-white text-sm leading-relaxed mb-4 drop-shadow-md line-clamp-3 text-center">
                      {section.description}
                    </p>
                    <div className="flex flex-col items-center text-white">
                      <span className="font-medium mr-2 drop-shadow-md text-center">
                        View Items
                      </span>
                      <span className="transform transition-transform duration-300 drop-shadow-md text-center">
                        ↓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Content - Full Width Below Cards */}
        {expandedCard && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {downloadSections.find(section => section.id === expandedCard)?.title}
              </h3>
              <button
                onClick={() => setExpandedCard(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {downloadSections
                .find(section => section.id === expandedCard)
                ?.thumbnails.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col items-center text-center"
                >
                  {/* Thumbnail Image */}
                  <div className="aspect-square relative w-full">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Download Info */}
                  <div className="p-4 flex flex-col items-center text-center w-full">
                    <h4 className="font-semibold text-gray-800 mb-2 text-center text-sm line-clamp-2 w-full">
                      {item.title}
                    </h4>
                    <button
                      onClick={() => handleDownload(item.downloadUrl, item.title)}
                      className={`px-4 py-2 rounded-md transition-colors font-medium flex items-center justify-center text-sm w-full max-w-[180px] bg-[#1e2939] hover:bg-[#2a3441] text-white`}
                    >
                      <span className="mr-2">
                        {item.downloadUrl.startsWith('/blog/') ? '📖' : '↓'}
                      </span>
                      {item.downloadUrl.startsWith('/blog/') ? 'Read Post' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;

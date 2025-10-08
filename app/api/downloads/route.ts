import { NextResponse } from 'next/server';

// Static download configuration that matches your actual files
const STATIC_DOWNLOADS = {
  'coloring-pages': {
    id: 'coloring-pages',
    title: 'Coloring Pages',
    description:
      'Free downloadable coloring pages for creating your own western-inspired garments.',
    image: '/images/Neon_Coloring_Mock.webp',
    thumbnails: [
      {
        id: 'abq-neon',
        title: 'ABQ Neon Coloring Page',
        thumbnail: '/images/Neon_Coloring_Mock.webp',
        downloadUrl: '/downloads/coloring-pages/ABQ_Neon_W+Color.pdf',
        description: 'Neon-inspired southwestern coloring design',
        type: 'pdf',
      },
      {
        id: 'ck-coloring-pages',
        title: 'CK Coloring Pages Collection',
        thumbnail: '/images/CK_Coloring_Button.webp',
        downloadUrl: '/downloads/coloring-pages/CK_Coloring_Pages_UP.pdf',
        description: 'Collection of Cowboy Kimono coloring pages',
        type: 'pdf',
      },
      {
        id: 'creativity-exercise',
        title: 'CK Creativity Exercise',
        thumbnail: '/images/CK_Coloring_Button.webp',
        downloadUrl: '/downloads/coloring-pages/CK_Creativity_Exercise.pdf',
        description: 'Creative coloring exercise activities',
        type: 'pdf',
      },
      {
        id: 'holiday-craft-templates',
        title: 'Holiday Craft Templates',
        thumbnail: '/images/CKCraft_Template2.webp',
        downloadUrl:
          '/downloads/coloring-pages/CK_Holiday_Craft_Templates_1.pdf',
        description: 'Holiday-themed craft templates',
        type: 'pdf',
      },
    ],
  },
  'craft-templates': {
    id: 'craft-templates',
    title: 'Craft Templates',
    description:
      'Artistic templates and stencils for painting and decorating your own cowboy kimonos.',
    image: '/images/CKCraft_Template2.webp',
    thumbnails: [
      {
        id: 'june-bugs',
        title: "3 June Bugs You'll Love Immediately",
        thumbnail: '/images/Craft_June_Bug.webp',
        downloadUrl: '/downloads/craft-templates/June_Bugs.pdf',
        description: 'Adorable June bug craft template',
        type: 'pdf',
      },
      {
        id: 'ox-book-corner',
        title: 'Year of the OX Irresistible Paper Craft',
        thumbnail: '/images/Ox_book_corner.webp',
        downloadUrl: '/downloads/craft-templates/Ox_Book_Corner.pdf',
        description: 'Year of the Ox bookmark craft',
        type: 'pdf',
      },
      {
        id: 'kickass-thanks',
        title: 'Create a Kickass Thank You for Your Mail Carrier',
        thumbnail: '/images/Kickass_Thanks_Envelope.webp',
        downloadUrl: '/downloads/craft-templates/Kickass_Thank_You.pdf',
        description: 'Mail carrier appreciation craft',
        type: 'pdf',
      },
      {
        id: 'labor-day',
        title: 'Your Labor is Loved (Labor Day Craft)',
        thumbnail: '/images/Labor_is_Loved.webp',
        downloadUrl: '/downloads/craft-templates/Labor_Day_Love.pdf',
        description: 'Labor Day appreciation craft',
        type: 'pdf',
      },
      {
        id: 'fathers-day',
        title: 'Yum. Fathers Day Craft',
        thumbnail: '/images/Father_Day_Muffins.webp',
        downloadUrl: '/downloads/craft-templates/Fathers_Day_Craft.pdf',
        description: "Father's Day craft template",
        type: 'pdf',
      },
      {
        id: 'milagro-ornaments',
        title: 'Jumbo Milagros for Mothers Day',
        thumbnail: '/images/Jumbo_Milagro.webp',
        downloadUrl:
          '/downloads/craft-templates/Milagro_Ornaments_w_instructions.pdf',
        description: "Mother's Day milagro ornament craft",
        type: 'pdf',
      },
      {
        id: 'grocery-bag-birds',
        title: 'Grocery Bag Bird Ornaments',
        thumbnail: '/images/Grocery_Bag_Birds_Green.webp',
        downloadUrl:
          '/downloads/craft-templates/Grocery_Bag_Birds_with_instructions.pdf',
        description: 'Recycled grocery bag bird craft',
        type: 'pdf',
      },
    ],
  },
  'diy-tutorials': {
    id: 'diy-tutorials',
    title: 'DIY Tutorials',
    description:
      'Comprehensive guides on caring for your handcrafted pieces and styling tips.',
    image: '/images/Jumbo_Milagro.webp',
    thumbnails: [
      {
        id: 'wash-painted-denim',
        title: 'How to Wash Painted Denim',
        thumbnail: '/images/CK_Wash_Painted_Denim.webp',
        downloadUrl: '/downloads/DIY-tutorials/CK_Wash_Painted_Denim.pdf',
        description: 'Care guide for handpainted denim',
        type: 'pdf',
      },
      {
        id: 'hip-jackalope',
        title: 'How to Create a Hip Jackalope Display',
        thumbnail: '/images/Jackalope_Glasses.webp',
        downloadUrl: '/blog/jackalope-garden-display-diy',
        description: 'DIY jackalope display tutorial',
        type: 'blog-post',
      },
      {
        id: 'sofa-table',
        title: 'Paint a One-of-a-kind Sofa Table',
        thumbnail: '/images/Sofa_Table.webp',
        downloadUrl: '/blog/paint-sofa-table',
        description: 'Furniture painting tutorial',
        type: 'blog-post',
      },
      {
        id: 'chalk-art',
        title: 'Animated Chalk Art',
        thumbnail: '/images/Animated_Chalk_Art.webp',
        downloadUrl: '/blog/animated-chalk-art',
        description: 'Chalk art animation tutorial',
        type: 'blog-post',
      },
      {
        id: 'scary-silhouettes',
        title: 'Create Scary Silhouettes',
        thumbnail: '/images/Scary_Silhouette.webp',
        downloadUrl: '/blog/scary-silhouettes',
        description: 'Halloween silhouette craft',
        type: 'blog-post',
      },
      {
        id: 'fabric-paint-pants',
        title: 'Fabric Paint Saves Stained Pants',
        thumbnail: '/images/CK_Indigo_Pants.webp',
        downloadUrl: '/blog/fabric-paint-stained-pants',
        description: 'Upcycling stained clothing',
        type: 'blog-post',
      },
      {
        id: 'christmas-star',
        title: 'Hello, Christmas Star (How Long Has it Been?)',
        thumbnail: '/images/Christmas_Star_SM.webp',
        downloadUrl: '/blog/christmas-star',
        description: 'Christmas decoration DIY',
        type: 'blog-post',
      },
      {
        id: 'cactus-patch',
        title: 'Cactus Patch Mail Art',
        thumbnail: '/images/Cactus_Doodles118.webp',
        downloadUrl: '/blog/cactus-patch-mail-art',
        description: 'Mail art tutorial',
        type: 'blog-post',
      },
    ],
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let responseData;

    if (
      category &&
      STATIC_DOWNLOADS[category as keyof typeof STATIC_DOWNLOADS]
    ) {
      // Return specific category
      responseData = {
        downloads: [
          STATIC_DOWNLOADS[category as keyof typeof STATIC_DOWNLOADS],
        ],
        pagination: {
          totalPosts: 1,
          totalPages: 1,
          currentPage: 1,
          perPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        meta: {
          total: 1,
          category,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Return all downloads
      responseData = {
        downloads: Object.values(STATIC_DOWNLOADS),
        pagination: {
          totalPosts: Object.keys(STATIC_DOWNLOADS).length,
          totalPages: 1,
          currentPage: 1,
          perPage: Object.keys(STATIC_DOWNLOADS).length,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        meta: {
          total: Object.keys(STATIC_DOWNLOADS).length,
          category: 'all',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching downloads:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch downloads',
        message: error instanceof Error ? error.message : 'Unknown error',
        downloads: [],
        pagination: {
          totalPosts: 0,
          totalPages: 1,
          currentPage: 1,
          perPage: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      { status: 500 }
    );
  }
}

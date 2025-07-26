# Cowboy Kimono v2 - Next.js Project

## 📋 Project Overview

**Version:** 2.1.2  
**Status:** Production Ready - GraphQL Schema Errors Investigation  
**Last Updated:** 2025-01-25  
**Framework:** Next.js 15.3.4 with App Router  
**Language:** TypeScript 5  
**Styling:** Tailwind CSS 4  

A modern, headless WordPress-powered website for Cowboy Kimono, featuring a blog, shop, and downloads section with advanced SEO optimization and social media integration.

## 🏗️ Architecture

### Technology Stack
- **Frontend:** Next.js 15.3.4, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4 with custom design system
- **CMS:** WordPress with WPGraphQL for headless content management
- **SEO:** Yoast SEO integration with structured data
- **Analytics:** Google Analytics 4 and Google Tag Manager
- **Deployment:** AWS Amplify with automatic builds
- **Performance:** Next.js Image optimization, lazy loading, and caching

### File Structure
```
ck-v2-nextjs/
├── app/                          # Next.js App Router
│   ├── components/               # Reusable React components
│   ├── lib/                      # Utility functions and API
│   ├── blog/                     # Blog pages and components
│   ├── shop/                     # Shop pages and components
│   ├── downloads/                # Downloads pages and components
│   └── globals.css              # Global styles
├── public/                       # Static assets
│   ├── images/                   # Optimized images
│   └── downloads/                # Downloadable files
├── ck-v2-nextjs.md              # Project documentation
└── package.json                  # Dependencies and scripts
```

## 🔧 Recent Updates

### 🔍 [2025-01-25] WordPress Search Enhancement
**Issue:** Search feature was only searching through posts on the current page (9 posts) instead of all WordPress content  
**Root Cause:** Client-side filtering was used instead of WordPress search functionality  
**Solution:** 
- Replaced client-side search filtering with WordPress GraphQL search
- Implemented proper search state management to handle search vs pagination modes
- Added search-specific UI with clear search functionality
- Enhanced search to respect category/tag filters when searching

**Technical Changes:**
- **WordPress Search Integration:** Used `POSTS_BY_SEARCH_QUERY` GraphQL query to search all WordPress content
- **Search State Management:** Added `isSearching`, `searchResults`, and `searchTotalResults` state variables
- **Search vs Pagination:** Disabled pagination during search mode and added proper state transitions
- **Search UI Enhancements:** Added clear search button, search results count, and search-specific messaging
- **Performance:** Increased search result limit to 50 posts for comprehensive search results
- **User Experience:** Added loading states specific to search operations

**Search Features:**
- **Full WordPress Search:** Searches all blog posts, not just current page content
- **Category/Tag Aware:** Respects current category or tag filters when searching
- **Real-time Results:** 300ms debounced search with immediate feedback
- **Clear Search:** Easy-to-use clear search functionality to return to normal browsing
- **Search Result Count:** Shows exact number of matches found
- **No Results Handling:** Proper messaging and clear search option when no results found

**User Experience Improvements:**
- Searches across ALL WordPress content, not just loaded posts
- Clear visual distinction between search mode and normal browsing
- Search results show actual WordPress search matches
- Easy transition between search and normal pagination
- Loading states specific to search operations

**Result:** Blog search now searches all WordPress content with proper WordPress search functionality

### 🔧 [2025-01-25] Blog Pagination Stability Fixes
**Issue:** Pagination on blog page was causing automatic page switching, loading elements in/out, and visual flashing  
**Root Cause:** Multiple state management issues including endCursor dependency loops, search clearing timing, and conflicting loading states  
**Solution:** 
- Removed `endCursor` from useEffect dependency array to prevent unwanted re-renders
- Improved search clearing timing during pagination to prevent content flashing
- Simplified loading state management with single transition overlay
- Enhanced pagination button states and visual feedback
- Added proper state cleanup and reset mechanisms

**Technical Changes:**
- **EndCursor Management:** Removed endCursor from main useEffect dependencies to prevent render loops
- **Search Timing:** Delayed search term clearing during page changes (50ms delay) to prevent visual flashing
- **Loading States:** Simplified from multiple loading indicators to single transition overlay
- **Pagination UI:** Improved button states and consolidated loading feedback
- **State Cleanup:** Added proper cleanup functions and state resets for category/tag changes
- **Error Handling:** Enhanced error state management during page transitions

**User Experience Improvements:**
- Eliminated automatic page switching and content flashing
- Smoother pagination transitions with proper loading states
- Better visual feedback with improved button states
- Prevented rapid clicking and state conflicts
- Enhanced accessibility with proper ARIA labels

**Result:** Blog pagination now works smoothly without automatic switching or loading conflicts

### 🚀 [2025-01-25] Final Deployment Preparation
**Enhancement:** Comprehensive blog improvements and fixes for production deployment  
**Features Added:**
- **Production-Ready Error Handling:** Removed console.error statements and improved error boundaries
- **Enhanced Loading States:** Better visual feedback with improved loading indicators and retry mechanisms
- **Accessibility Improvements:** Added ARIA labels, better semantic HTML, and screen reader support
- **Performance Optimizations:** Improved image loading, better mobile responsiveness, and optimized pagination
- **Security Enhancements:** Added content sanitization and security attributes for blog post content
- **Mobile UX Improvements:** Enhanced responsive design with better touch targets and spacing
- **Pagination UX Fixes:** Eliminated stuttering and flashing during page navigation with smooth loading states
- **Pagination State Management:** Fixed flashing between pages by improving search reset timing and adding loading overlays
- **Pagination Flash Prevention:** Completely eliminated card flashing during pagination by implementing proper state management and transition controls

**Technical Changes:**
- **Error Handling:** Replaced console.error with proper error handling for production
- **Loading States:** Enhanced loading indicators with better messaging and retry options
- **Accessibility:** Added aria-label, aria-describedby, and aria-current attributes
- **Image Optimization:** Improved sizes attribute for better responsive image loading
- **Mobile Responsiveness:** Enhanced breakpoints and touch-friendly interactions
- **Content Security:** Added suppressHydrationWarning for blog post content
- **Pagination Improvements:** Added debounced search, loading states, and button disable states
- **Performance:** Optimized search functionality with 300ms debounce to prevent excessive filtering
- **Pagination State Management:** Added search reset timing control and loading overlays to prevent content flashing
- **Pagination Flash Prevention:** Implemented `isTransitioning` state to control visual transitions, immediate search clearing on page change, and opacity transitions to eliminate card flashing

**Quality Improvements:**
- **SEO Enhancement:** Better meta tags and structured data handling
- **Performance:** Optimized image loading and reduced unnecessary re-renders
- **User Experience:** Improved error messages and loading feedback
- **Accessibility:** Better screen reader support and keyboard navigation
- **Mobile Experience:** Enhanced responsive design for all screen sizes

### 🎨 [2025-01-25] Pinterest-Style Blog Layout Enhancement
**Enhancement:** Complete blog section redesign with Pinterest-style masonry layout and enhanced functionality  
**Features Added:**
- **Pinterest-Style Layout:** CSS columns-based masonry layout with natural image aspect ratios
- **Enhanced Blog Cards:** Larger cards with natural image proportions, improved shadows and depth
- **Search & Filtering:** Real-time search functionality with post title and excerpt matching
- **Sticky Sidebar:** Sidebar becomes sticky on scroll for better navigation
- **Serif Typography:** Restored serif fonts for blog post titles while maintaining modern sizing
- **Mobile Responsiveness:** Improved mobile layout with better touch targets and spacing
- **Enhanced Blog Post Pages:** Larger typography, better spacing, modern styling
- **Better Visual Hierarchy:** Improved color scheme, spacing, and component organization

**Design Changes:**
- **Layout:** CSS columns-based masonry layout (`columns-1 md:columns-2 lg:columns-3`) for Pinterest-style organic flow
- **Cards:** Larger cards with `rounded-xl`, enhanced shadows, hover lift effect, natural image aspect ratios
- **Images:** Natural aspect ratios instead of forced dimensions for more organic Pinterest-style appearance
- **Typography:** Serif fonts for titles (`serif` class), larger base text, enhanced readability
- **Search:** Prominent search bar with real-time filtering and result count display
- **Sidebar:** Sticky positioning, improved spacing, matching design aesthetic
- **Mobile:** Better responsive breakpoints, improved touch targets, enhanced spacing
- **Animations:** Smooth transitions with longer durations for premium feel
- **Spacing:** Increased padding (`p-6 lg:p-8`) and gaps (`gap-6 lg:gap-8`) for larger, more prominent cards

### 🎨 [2025-01-25] Blog Post Hero Image Enhancement
**Enhancement:** Improved hero image display on individual blog post pages  
**Features Added:**
- **Full Image Display:** Hero images now display without cropping or box constraints
- **Flexible Object Fit:** WordPressImage component now supports configurable object-fit behavior
- **Natural Aspect Ratios:** Hero images maintain their natural proportions
- **Removed Box Styling:** Eliminated rounded corners, shadows, and overflow constraints for hero images
- **Enhanced WordPressImage Component:** Added `objectFit` prop for flexible image display options

**Technical Changes:**
- **WordPressImage Component:** Added `objectFit` prop with options: 'cover', 'contain', 'fill', 'none', 'scale-down'
- **Blog Post Page:** Updated hero image to use `objectFit="none"` for full image display
- **Container Styling:** Removed `rounded-xl overflow-hidden shadow-xl` classes from hero image container
- **Image Display:** Hero images now display at full width without artificial constraints

### 🎨 [2025-01-25] Related Posts UI Enhancement
**Enhancement:** Simplified related posts display on individual blog post pages  
**Features Added:**
- **Removed "Highly Related" Badge:** Eliminated the blue "Highly related" bubble from related posts
- **Cleaner UI:** Simplified post display with just title and date
- **Better Visual Hierarchy:** Reduced visual clutter in the sidebar
- **Consistent Design:** Maintained clean, minimal aesthetic across the site

**Technical Changes:**
- **RelatedPosts Component:** Removed conditional rendering of "Highly related" badge
- **UI Simplification:** Streamlined post information display
- **Design Consistency:** Aligned with overall site design principles

### 🎨 [2025-01-25] Blog Post Footer Enhancement
**Enhancement:** Improved social share and post navigation features on individual blog post pages  
**Features Added:**
- **Enhanced Social Share:** Added prominent "Share this post" label and beefed up buttons with text labels
- **Improved Post Navigation:** Stacked next post on top of previous post for better visual flow
- **Better Layout:** Grid-based layout ensures both sections are evenly sized
- **Enhanced Buttons:** Larger, more prominent social share buttons with icon and text
- **Contained Navigation:** Post navigation buttons stay within their designated box

**Technical Changes:**
- **SocialShare Component:** Added title label and enhanced button styling with text labels
- **PostNavigation Component:** Changed from horizontal to vertical stacking layout
- **BlogPostFooter Component:** Updated to use grid layout for better section alignment
- **Button Enhancement:** Social share buttons now include both icon and text for better usability

### 🔧 [2025-01-25] Related Posts Algorithm Enhancement
**Issue:** Related posts component needed optimization for better content discovery and fallback handling  
**Root Cause:** Previous algorithm was too restrictive and didn't ensure all content could be recommended  
**Solution:** 
- Enhanced scoring algorithm with 6 comprehensive strategies
- Added fallback mechanisms to ensure content is always available
- Improved inclusivity with lowered similarity thresholds
- Added author-based recommendations and emergency fallbacks

**Algorithm Strategies (in priority order):**
1. **Exact tag matches** - 12 points per matching tag
2. **Exact category matches** - 10 points per matching category  
3. **Content similarity analysis** - Up to 25 points (lowered threshold to 5%)
4. **Partial tag matches** - 4 points per similar tag
5. **Recent posts** - 2 points (ensures all content gets recommended)

**Note:** Same author scoring was removed as all content has the same author, providing no differentiation.

**Fallback Features:**
- Automatic fallback to recent posts when insufficient matches found
- Emergency fallback system for error conditions
- Smart UI messaging that adapts based on content quality
- "You Might Also Like" vs "Related Posts" titles based on relevance scores

**UI Improvements:**
- Removed debug console logs for production
- Dynamic titles based on content relevance
- "Highly related" badges for top matches
- Contextual messaging for fallback content

**Result:** All content on the site can now be recommended with intelligent scoring and graceful fallbacks

### 🔧 [2025-01-25] Related Posts Error Handling & Algorithm Optimization
**Issue:** `calculateContentSimilarity` function throwing errors due to undefined/null content fields  
**Root Cause:** Missing null/undefined checks for content and title fields causing crashes  
**Solution:** 
- Added comprehensive error handling to `calculateContentSimilarity` and `calculateTitleSimilarity` functions
- Added validation for post content and title fields before processing
- Removed same author scoring strategy as all content has the same author
- Enhanced defensive programming with try-catch blocks

**Changes Made:**
- Fixed null/undefined content handling in similarity calculations
- Added input validation for string types and empty content
- Removed unused `currentAuthorId` variable after removing same author strategy
- Added post validation checks in `fetchRelatedPosts` function

**Result:** Eliminated crashes in related posts algorithm and improved reliability

### 🔧 [2025-01-25] GraphQL Schema Errors Investigation
**Issue:** Multiple GraphQL schema errors preventing blog posts from loading  
**Investigation:** 
- Removed problematic SEO fields from GraphQL queries that don't exist in WordPress schema
- Fixed `mediaDetails.sizes` field inclusion in all queries
- Updated queries: `POSTS_QUERY`, `POSTS_BY_CATEGORY_QUERY`, `POSTS_BY_SEARCH_QUERY`, `POST_BY_SLUG_QUERY`, `CATEGORY_BY_SLUG_QUERY`, `TAG_BY_SLUG_QUERY`
- **Status:** Ongoing - Page loads but shows loading spinner, indicating GraphQL queries still failing

**Changes Made:**
- Removed SEO fields from all GraphQL queries that were causing schema errors
- Ensured all queries include `mediaDetails.sizes` field for proper image handling
- Maintained essential fields while removing problematic ones

**Next Steps:**
- Investigate remaining GraphQL connection issues
- Test with simplified queries to identify root cause
- Consider WordPress GraphQL plugin configuration

### 🔧 [2025-01-25] Tag Filtering Enhancement
**Issue:** Tag links in blog section were not properly filtering posts by tag  
**Root Cause:** `fetchPosts` and `fetchPostsWithPagination` functions had `tagName` parameter but weren't using it  
**Solution:** 
- Added `POSTS_BY_TAG_QUERY` GraphQL query for filtering posts by tag slug
- Updated `fetchPosts` function to use `tagName` parameter with proper query selection
- Updated `fetchPostsWithPagination` function to support tag filtering
- Ensured tag links in sidebar and individual blog posts properly link to filtered tag pages

**Changes Made:**
- **New GraphQL Query:** Added `POSTS_BY_TAG_QUERY` that filters posts by tag slug using `tagSlugAnd` parameter
- **Function Updates:** Modified `fetchPosts` and `fetchPostsWithPagination` to handle `tagName` parameter
- **Query Selection:** Added proper conditional logic to select appropriate query based on parameters
- **Variable Mapping:** Ensured `tagSlug` variable is properly passed to GraphQL queries

**Features Enhanced:**
- **Tag Links in Sidebar:** Now properly filter posts when clicked
- **Tag Links in Blog Posts:** Individual post tag links now work correctly
- **Tag Pages:** `/blog/tag/[slug]` pages now display filtered posts in same format as main blog
- **Consistent UI:** Tag-filtered pages maintain the same Pinterest-style layout and card format

**Result:** Tag links throughout the blog section now properly filter and display posts with the same card format as the main blog page

### 🔧 [2025-01-25] GraphQL Image Sizes Fix
**Issue:** `getFeaturedImageUrl` function failing due to missing `mediaDetails.sizes` in GraphQL queries  
**Solution:** Updated all relevant GraphQL queries to include `mediaDetails.sizes`

### 🎯 [2025-01-25] Enhanced Related Posts Algorithm
**Issue:** Related posts occasionally showed duplicates and didn't effectively showcase content diversity across WordPress site  
**Root Cause:** Previous algorithm focused primarily on exact matches without comprehensive duplicate prevention or content diversity strategies  
**Solution:** 
- Complete rewrite of `fetchRelatedPosts` function with focus on content diversity and guaranteed duplicate prevention
- Implemented comprehensive scoring system with 8 distinct strategies to showcase site-wide content
- Added strict duplicate prevention using Set-based tracking from initialization
- Enhanced content discovery to actively promote different categories, time periods, and content types

**Technical Changes:**
- **Guaranteed Duplicate Prevention:** Used Set-based tracking (`usedPostIds`) from function start with comprehensive final verification
- **Content Pool Expansion:** Increased post pool from 100 to 150 posts for better diversity analysis
- **8-Strategy Scoring System:** Implemented comprehensive content discovery and scoring
- **Diversity Tracking:** Added `diversityFactors` Set to track and bonus posts with multiple diversity elements
- **Smart Selection:** Two-pass selection prioritizing both relevance scores and content diversity
- **Enhanced Fallbacks:** Multi-level fallback system ensuring diverse content even in edge cases

**Related Posts Strategies:**
1. **Exact Tag Matches with Diversity Bonus:** High scores for exact tag matches with diminishing returns for tag overuse
2. **Category Matches with Cross-Category Diversity:** Category matching with bonus for exploring different categories
3. **Cross-Category Exploration (NEW):** Active discovery of content from entirely different categories
4. **Temporal Diversity (NEW):** Spread recommendations across different time periods (recent, past month, quarter, archive)
5. **Content Similarity (Refined):** Improved similarity algorithm with balanced content and title analysis
6. **Tag Ecosystem Exploration (NEW):** Discovery of related but different tags to expand content variety
7. **Content Length Diversity (NEW):** Ensure variety in content types (short, medium, long posts)
8. **Featured Content Boost (NEW):** Slight preference for visually appealing posts with featured images

**Diversity Features:**
- **Category Diversity:** Actively seeks posts from different categories to showcase site breadth
- **Tag Diversity:** Promotes posts with varied tag combinations
- **Temporal Diversity:** Balances recent and archived content for comprehensive site representation
- **Content Type Diversity:** Varies content length and visual appeal
- **Diminishing Returns:** Prevents over-representation of any single category or tag
- **Two-Pass Selection:** First pass for high relevance (60%), second pass for diversity (40%)

**User Experience Improvements:**
- Eliminated duplicate posts completely with multiple verification layers
- Enhanced content discovery showcasing full WordPress site diversity
- Better representation of different content themes and categories
- Improved visual appeal with featured image prioritization
- More engaging recommendations spanning different time periods
- Comprehensive fallback system ensuring quality recommendations always

**Performance Enhancements:**
- Efficient Map-based scoring system for O(1) post lookups
- Set-based duplicate prevention for O(1) uniqueness checks
- Optimized GraphQL queries with targeted post limits
- Smart candidate filtering reducing unnecessary processing

**Result:** Related posts now provide comprehensive site content diversity with guaranteed duplicate prevention, effectively showcasing the full breadth of WordPress content while maintaining relevance
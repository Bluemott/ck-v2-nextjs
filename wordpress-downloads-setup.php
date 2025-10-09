<?php
/**
 * WordPress Downloads Custom Post Type Configuration
 * Add this to your theme's functions.php file
 * 
 * This registers the 'downloads' custom post type and exposes it to the REST API
 * Required for the Cowboy Kimono downloads page to function
 */

// Register Downloads Custom Post Type
function ck_register_downloads_post_type() {
    $labels = array(
        'name'               => 'Downloads',
        'singular_name'      => 'Download',
        'menu_name'          => 'Downloads',
        'add_new'            => 'Add New',
        'add_new_item'       => 'Add New Download',
        'edit_item'          => 'Edit Download',
        'new_item'           => 'New Download',
        'view_item'          => 'View Download',
        'search_items'       => 'Search Downloads',
        'not_found'          => 'No downloads found',
        'not_found_in_trash' => 'No downloads found in trash',
    );

    $args = array(
        'labels'              => $labels,
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'query_var'           => true,
        'rewrite'             => array('slug' => 'downloads'),
        'capability_type'     => 'post',
        'has_archive'         => true,
        'hierarchical'        => false,
        'menu_position'       => 5,
        'menu_icon'           => 'dashicons-download',
        'supports'            => array('title', 'editor', 'thumbnail', 'excerpt'),
        
        // CRITICAL: REST API Configuration
        'show_in_rest'        => true,  // Enable REST API
        'rest_base'           => 'downloads',  // REST API endpoint: /wp-json/wp/v2/downloads
        'rest_controller_class' => 'WP_REST_Posts_Controller',
    );

    register_post_type('downloads', $args);
}
add_action('init', 'ck_register_downloads_post_type');

// Flush rewrite rules on activation (run once)
function ck_downloads_rewrite_flush() {
    ck_register_downloads_post_type();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'ck_downloads_rewrite_flush');

// Expose ACF fields to REST API
function ck_add_downloads_acf_to_rest() {
    // Only run if ACF is active
    if (!function_exists('get_field')) {
        return;
    }
    
    register_rest_field('downloads', 'acf', array(
        'get_callback' => function($post) {
            return array(
                'download_category'    => get_field('download_category', $post['id']),
                'download_file'        => get_field('download_file', $post['id']),
                'download_thumbnail'   => get_field('download_thumbnail', $post['id']),
                'download_type'        => get_field('download_type', $post['id']),
                'download_url'         => get_field('download_url', $post['id']),
                'download_description' => get_field('download_description', $post['id']),
            );
        },
        'update_callback' => null,
        'schema'          => null,
    ));
}
add_action('rest_api_init', 'ck_add_downloads_acf_to_rest');

/**
 * ACF Field Group Configuration
 * 
 * Install ACF Pro and create a field group named "Downloads" with these fields:
 * 
 * Field Name: download_category
 * - Field Type: Text
 * - Instructions: Enter the category (e.g., "coloring-pages", "craft-templates", "diy-tutorials")
 * - Required: Yes
 * 
 * Field Name: download_file
 * - Field Type: File
 * - Instructions: Upload the PDF or file to download
 * - Return Format: File ID
 * - Required: No (if using download_url instead)
 * 
 * Field Name: download_thumbnail
 * - Field Type: Image
 * - Instructions: Upload a thumbnail image for this download
 * - Return Format: Image ID
 * - Required: No (will use featured image if not set)
 * 
 * Field Name: download_type
 * - Field Type: Select
 * - Choices:
 *   - pdf : PDF Download
 *   - blog-post : Blog Post Link
 *   - file : File Download
 * - Default: pdf
 * - Required: Yes
 * 
 * Field Name: download_url
 * - Field Type: URL
 * - Instructions: Enter URL for blog posts or external links (leave empty for file downloads)
 * - Required: No
 * 
 * Field Name: download_description
 * - Field Type: Text Area
 * - Instructions: Optional description for this download
 * - Required: No
 * 
 * Location Rules:
 * - Post Type is equal to Downloads
 * 
 * Settings:
 * - Show in REST: Yes (CRITICAL)
 */

/**
 * Example REST API Response
 * 
 * GET https://api.cowboykimono.com/wp-json/wp/v2/downloads
 * 
 * [
 *   {
 *     "id": 123,
 *     "title": {
 *       "rendered": "ABQ Neon Coloring Page"
 *     },
 *     "excerpt": {
 *       "rendered": "Western-themed coloring page"
 *     },
 *     "featured_media": 456,
 *     "acf": {
 *       "download_category": "coloring-pages",
 *       "download_file": 789,
 *       "download_thumbnail": 456,
 *       "download_type": "pdf",
 *       "download_url": "",
 *       "download_description": "Beautiful western design"
 *     },
 *     "_embedded": {
 *       "wp:featuredmedia": [
 *         {
 *           "id": 456,
 *           "source_url": "https://api.cowboykimono.com/wp-content/uploads/2025/01/thumbnail.jpg"
 *         }
 *       ]
 *     }
 *   }
 * ]
 */

/**
 * Testing the REST API
 * 
 * 1. Create a test download post in WordPress admin
 * 2. Test the endpoint:
 *    curl https://api.cowboykimono.com/wp-json/wp/v2/downloads
 * 
 * 3. Verify response includes:
 *    - id, title, excerpt
 *    - featured_media
 *    - acf object with all fields
 *    - _embedded.wp:featuredmedia (if using ?_embed=1)
 * 
 * 4. Test category filtering:
 *    https://cowboykimono.com/api/downloads?category=coloring-pages
 */


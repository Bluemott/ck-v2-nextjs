<?php
/**
 * Plugin Name: IndexNow Integration for Cowboy Kimono
 * Description: Automatically submit new WordPress content to IndexNow for faster search engine indexing
 * Version: 1.0.1
 * Author: Cowboy Kimono
 * 
 * This plugin automatically submits new WordPress posts, categories, and tags
 * to IndexNow when they are published, ensuring faster search engine indexing.
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class IndexNowIntegration {
    
    private $webhook_url;
    private $webhook_secret;
    
    public function __construct() {
        // Configure webhook URL - update this to your actual domain
        $this->webhook_url = 'https://www.cowboykimono.com/api/wordpress-webhook';
        
        // Optional: Set a webhook secret for security (should match WORDPRESS_WEBHOOK_SECRET)
        $this->webhook_secret = 'your-webhook-secret-here'; // Update this
        
        // Hook into WordPress events
        add_action('publish_post', array($this, 'submit_post_to_indexnow'), 10, 2);
        add_action('wp_insert_term', array($this, 'submit_term_to_indexnow'), 10, 3);
        add_action('edited_term', array($this, 'submit_term_to_indexnow'), 10, 3);
        
        // Add admin menu - FIXED: Ensure proper hook priority
        add_action('admin_menu', array($this, 'add_admin_menu'), 20);
        
        // Add settings
        add_action('admin_init', array($this, 'init_settings'));
        
        // Add activation hook
        register_activation_hook(__FILE__, array($this, 'activate_plugin'));
    }
    
    /**
     * Plugin activation
     */
    public function activate_plugin() {
        // Set default options if they don't exist
        if (!get_option('indexnow_webhook_url')) {
            update_option('indexnow_webhook_url', $this->webhook_url);
        }
        if (!get_option('indexnow_webhook_secret')) {
            update_option('indexnow_webhook_secret', $this->webhook_secret);
        }
        if (!get_option('indexnow_enabled')) {
            update_option('indexnow_enabled', '1');
        }
    }
    
    /**
     * Submit a published post to IndexNow
     */
    public function submit_post_to_indexnow($post_id, $post) {
        // Check if IndexNow is enabled
        if (get_option('indexnow_enabled') !== '1') {
            return;
        }
        
        // Only submit published posts
        if ($post->post_status !== 'publish') {
            return;
        }
        
        // Get post data
        $post_slug = $post->post_name;
        $categories = wp_get_post_categories($post_id, array('fields' => 'slugs'));
        $tags = wp_get_post_tags($post_id, array('fields' => 'slugs'));
        
        // Prepare webhook data
        $webhook_data = array(
            'action' => 'publish',
            'post_type' => 'post',
            'post_id' => $post_id,
            'post_slug' => $post_slug,
            'post_status' => $post->post_status,
            'categories' => $categories,
            'tags' => $tags,
            'urls' => array(
                get_permalink($post_id)
            )
        );
        
        // Submit to webhook
        $this->submit_webhook($webhook_data);
        
        // Log the submission
        error_log("IndexNow: Submitted post '{$post_slug}' to webhook");
    }
    
    /**
     * Submit a term (category/tag) to IndexNow
     */
    public function submit_term_to_indexnow($term_id, $tt_id, $taxonomy) {
        // Check if IndexNow is enabled
        if (get_option('indexnow_enabled') !== '1') {
            return;
        }
        
        $term = get_term($term_id, $taxonomy);
        
        if (!$term || is_wp_error($term)) {
            return;
        }
        
        // Determine term type
        $term_type = ($taxonomy === 'category') ? 'category' : 'tag';
        
        // Prepare webhook data
        $webhook_data = array(
            'action' => 'publish',
            'post_type' => $term_type,
            'post_id' => $term_id,
            'post_slug' => $term->slug,
            'post_status' => 'publish',
            'urls' => array(
                get_term_link($term)
            )
        );
        
        // Submit to webhook
        $this->submit_webhook($webhook_data);
        
        // Log the submission
        error_log("IndexNow: Submitted {$term_type} '{$term->slug}' to webhook");
    }
    
    /**
     * Submit data to the webhook
     */
    private function submit_webhook($data) {
        $webhook_url = get_option('indexnow_webhook_url', $this->webhook_url);
        $webhook_secret = get_option('indexnow_webhook_secret', $this->webhook_secret);
        
        $args = array(
            'method' => 'POST',
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress/IndexNow-Integration/1.0.1'
            ),
            'body' => json_encode($data),
            'timeout' => 30
        );
        
        // Add webhook secret if configured
        if (!empty($webhook_secret)) {
            $args['headers']['x-webhook-secret'] = $webhook_secret;
        }
        
        // Make the request
        $response = wp_remote_post($webhook_url, $args);
        
        if (is_wp_error($response)) {
            error_log("IndexNow: Webhook error - " . $response->get_error_message());
        } else {
            $status_code = wp_remote_retrieve_response_code($response);
            $body = wp_remote_retrieve_body($response);
            
            if ($status_code !== 200) {
                error_log("IndexNow: Webhook returned status {$status_code} - {$body}");
            } else {
                error_log("IndexNow: Webhook successful - {$body}");
            }
        }
    }
    
    /**
     * Add admin menu - FIXED: Ensure proper menu structure
     */
    public function add_admin_menu() {
        // Add to Settings menu
        add_options_page(
            'IndexNow Integration Settings',
            'IndexNow',
            'manage_options',
            'indexnow-integration',
            array($this, 'admin_page')
        );
        
        // Also add to main menu for easier access
        add_menu_page(
            'IndexNow Integration',
            'IndexNow',
            'manage_options',
            'indexnow-integration',
            array($this, 'admin_page'),
            'dashicons-admin-links',
            30
        );
    }
    
    /**
     * Initialize settings
     */
    public function init_settings() {
        register_setting('indexnow_options', 'indexnow_webhook_url');
        register_setting('indexnow_options', 'indexnow_webhook_secret');
        register_setting('indexnow_options', 'indexnow_enabled');
    }
    
    /**
     * Admin page
     */
    public function admin_page() {
        // Handle form submission
        if (isset($_POST['submit'])) {
            update_option('indexnow_webhook_url', sanitize_text_field($_POST['indexnow_webhook_url']));
            update_option('indexnow_webhook_secret', sanitize_text_field($_POST['indexnow_webhook_secret']));
            update_option('indexnow_enabled', isset($_POST['indexnow_enabled']) ? '1' : '0');
            echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
        }
        
        // Get current settings
        $webhook_url = get_option('indexnow_webhook_url', $this->webhook_url);
        $webhook_secret = get_option('indexnow_webhook_secret', $this->webhook_secret);
        $enabled = get_option('indexnow_enabled', '1');
        ?>
        <div class="wrap">
            <h1>IndexNow Integration Settings</h1>
            
            <form method="post" action="">
                <table class="form-table">
                    <tr>
                        <th scope="row">Enable IndexNow</th>
                        <td>
                            <input type="checkbox" name="indexnow_enabled" value="1" 
                                   <?php checked($enabled, '1'); ?> />
                            <p class="description">Enable automatic IndexNow submissions</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Webhook URL</th>
                        <td>
                            <input type="url" name="indexnow_webhook_url" 
                                   value="<?php echo esc_attr($webhook_url); ?>" 
                                   class="regular-text" />
                            <p class="description">URL of the IndexNow webhook endpoint</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">Webhook Secret</th>
                        <td>
                            <input type="text" name="indexnow_webhook_secret" 
                                   value="<?php echo esc_attr($webhook_secret); ?>" 
                                   class="regular-text" />
                            <p class="description">Optional secret for webhook authentication</p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Save Settings'); ?>
            </form>
            
            <div class="card">
                <h2>Test IndexNow Submission</h2>
                <p>Test the IndexNow integration by submitting a recent post:</p>
                
                <?php
                $recent_posts = get_posts(array(
                    'numberposts' => 5,
                    'post_status' => 'publish'
                ));
                
                if ($recent_posts): ?>
                    <form method="post" action="">
                        <select name="test_post_id">
                            <?php foreach ($recent_posts as $post): ?>
                                <option value="<?php echo $post->ID; ?>">
                                    <?php echo esc_html($post->post_title); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <input type="submit" name="test_indexnow" value="Test Submission" class="button" />
                    </form>
                <?php endif; ?>
                
                <?php
                if (isset($_POST['test_indexnow']) && isset($_POST['test_post_id'])) {
                    $post_id = intval($_POST['test_post_id']);
                    $post = get_post($post_id);
                    
                    if ($post) {
                        $this->submit_post_to_indexnow($post_id, $post);
                        echo '<div class="notice notice-success"><p>Test submission sent! Check your server logs for details.</p></div>';
                    }
                }
                ?>
            </div>
            
            <div class="card">
                <h2>Manual Submission</h2>
                <p>You can also manually submit URLs using the debug interface:</p>
                <p><a href="https://www.cowboykimono.com/debug/indexnow" target="_blank" class="button">
                    Open IndexNow Debug Page
                </a></p>
            </div>
            
            <div class="card">
                <h2>Status Information</h2>
                <p><strong>Plugin Status:</strong> <?php echo $enabled === '1' ? 'Enabled' : 'Disabled'; ?></p>
                <p><strong>Webhook URL:</strong> <?php echo esc_html($webhook_url); ?></p>
                <p><strong>Webhook Secret:</strong> <?php echo !empty($webhook_secret) ? 'Configured' : 'Not configured'; ?></p>
            </div>
        </div>
        <?php
    }
}

// Initialize the plugin
new IndexNowIntegration();

/**
 * Manual submission function (can be called from other plugins/themes)
 */
function submit_url_to_indexnow($urls) {
    $webhook_url = get_option('indexnow_webhook_url', 'https://www.cowboykimono.com/api/wordpress-webhook');
    $webhook_secret = get_option('indexnow_webhook_secret', '');
    
    $data = array(
        'action' => 'publish',
        'urls' => is_array($urls) ? $urls : array($urls)
    );
    
    $args = array(
        'method' => 'POST',
        'headers' => array(
            'Content-Type' => 'application/json',
            'User-Agent' => 'WordPress/IndexNow-Integration/1.0.1'
        ),
        'body' => json_encode($data),
        'timeout' => 30
    );
    
    if (!empty($webhook_secret)) {
        $args['headers']['x-webhook-secret'] = $webhook_secret;
    }
    
    return wp_remote_post($webhook_url, $args);
}

/**
 * Example usage in other plugins/themes:
 * 
 * // Submit a single URL
 * submit_url_to_indexnow('https://www.cowboykimono.com/blog/my-post');
 * 
 * // Submit multiple URLs
 * submit_url_to_indexnow(array(
 *     'https://www.cowboykimono.com/blog/post-1',
 *     'https://www.cowboykimono.com/blog/post-2'
 * ));
 */ 
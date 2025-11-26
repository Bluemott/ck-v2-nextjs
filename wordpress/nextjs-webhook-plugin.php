<?php
/**
 * Plugin Name: Next.js ISR Webhook
 * Description: Sends webhook notifications to Next.js when content is created, updated, or deleted. Triggers ISR revalidation for instant content updates.
 * Version: 1.0.0
 * Author: Cowboy Kimono
 * License: GPL v2 or later
 * 
 * Installation:
 * 1. Copy this file to wp-content/plugins/nextjs-webhook/nextjs-webhook.php
 * 2. Create the directory if it doesn't exist: wp-content/plugins/nextjs-webhook/
 * 3. Activate the plugin in WordPress admin
 * 4. Configure the webhook URL in Settings > Next.js Webhook
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class NextJS_ISR_Webhook {
    
    private $option_name = 'nextjs_webhook_settings';
    private $webhook_url;
    private $webhook_secret;
    
    public function __construct() {
        // Load settings
        $settings = get_option($this->option_name, array());
        $this->webhook_url = isset($settings['webhook_url']) ? $settings['webhook_url'] : '';
        $this->webhook_secret = isset($settings['webhook_secret']) ? $settings['webhook_secret'] : '';
        
        // Admin hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Content hooks - Posts
        add_action('publish_post', array($this, 'on_post_publish'), 10, 2);
        add_action('save_post', array($this, 'on_post_save'), 10, 3);
        add_action('before_delete_post', array($this, 'on_post_delete'), 10, 1);
        add_action('wp_trash_post', array($this, 'on_post_trash'), 10, 1);
        add_action('untrash_post', array($this, 'on_post_untrash'), 10, 1);
        
        // Content hooks - Downloads (custom post type)
        add_action('publish_downloads', array($this, 'on_download_publish'), 10, 2);
        add_action('save_post_downloads', array($this, 'on_download_save'), 10, 3);
        
        // Category and Tag hooks
        add_action('created_category', array($this, 'on_term_change'), 10, 2);
        add_action('edited_category', array($this, 'on_term_change'), 10, 2);
        add_action('delete_category', array($this, 'on_term_change'), 10, 2);
        add_action('created_post_tag', array($this, 'on_term_change'), 10, 2);
        add_action('edited_post_tag', array($this, 'on_term_change'), 10, 2);
        add_action('delete_post_tag', array($this, 'on_term_change'), 10, 2);
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'Next.js Webhook Settings',
            'Next.js Webhook',
            'manage_options',
            'nextjs-webhook',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting($this->option_name, $this->option_name, array($this, 'sanitize_settings'));
        
        add_settings_section(
            'nextjs_webhook_main',
            'Webhook Configuration',
            array($this, 'render_section_info'),
            'nextjs-webhook'
        );
        
        add_settings_field(
            'webhook_url',
            'Webhook URL',
            array($this, 'render_webhook_url_field'),
            'nextjs-webhook',
            'nextjs_webhook_main'
        );
        
        add_settings_field(
            'webhook_secret',
            'Webhook Secret (Optional)',
            array($this, 'render_webhook_secret_field'),
            'nextjs-webhook',
            'nextjs_webhook_main'
        );
    }
    
    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = array();
        
        if (isset($input['webhook_url'])) {
            $sanitized['webhook_url'] = esc_url_raw($input['webhook_url']);
        }
        
        if (isset($input['webhook_secret'])) {
            $sanitized['webhook_secret'] = sanitize_text_field($input['webhook_secret']);
        }
        
        return $sanitized;
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Next.js Webhook Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields($this->option_name);
                do_settings_sections('nextjs-webhook');
                submit_button();
                ?>
            </form>
            
            <hr>
            
            <h2>Test Webhook</h2>
            <p>Click the button below to send a test webhook to verify your configuration.</p>
            <button type="button" class="button" id="test-webhook">Send Test Webhook</button>
            <div id="test-result" style="margin-top: 10px;"></div>
            
            <script>
            jQuery(document).ready(function($) {
                $('#test-webhook').click(function() {
                    var button = $(this);
                    button.prop('disabled', true).text('Sending...');
                    
                    $.post(ajaxurl, {
                        action: 'nextjs_test_webhook',
                        nonce: '<?php echo wp_create_nonce('nextjs_test_webhook'); ?>'
                    }, function(response) {
                        button.prop('disabled', false).text('Send Test Webhook');
                        if (response.success) {
                            $('#test-result').html('<div class="notice notice-success"><p>' + response.data + '</p></div>');
                        } else {
                            $('#test-result').html('<div class="notice notice-error"><p>' + response.data + '</p></div>');
                        }
                    });
                });
            });
            </script>
            
            <hr>
            
            <h2>Webhook Payload Format</h2>
            <p>The webhook sends the following JSON payload:</p>
            <pre style="background: #f0f0f0; padding: 15px; overflow-x: auto;">
{
    "post_id": 123,
    "post_title": "Post Title",
    "post_name": "post-slug",
    "post_status": "publish",
    "post_type": "post",
    "old_slug": "old-slug",
    "new_slug": "new-slug",
    "timestamp": "2024-01-01T00:00:00Z",
    "user_id": 1,
    "user_login": "admin",
    "user_email": "admin@example.com"
}
            </pre>
        </div>
        <?php
    }
    
    /**
     * Render section info
     */
    public function render_section_info() {
        echo '<p>Configure your Next.js webhook endpoint to receive content update notifications.</p>';
        echo '<p><strong>Webhook URL:</strong> https://cowboykimono.com/api/wordpress-webhook</p>';
    }
    
    /**
     * Render webhook URL field
     */
    public function render_webhook_url_field() {
        $settings = get_option($this->option_name, array());
        $value = isset($settings['webhook_url']) ? $settings['webhook_url'] : 'https://cowboykimono.com/api/wordpress-webhook';
        ?>
        <input type="url" name="<?php echo $this->option_name; ?>[webhook_url]" 
               value="<?php echo esc_attr($value); ?>" 
               class="regular-text" 
               placeholder="https://cowboykimono.com/api/wordpress-webhook">
        <p class="description">The URL of your Next.js webhook endpoint.</p>
        <?php
    }
    
    /**
     * Render webhook secret field
     */
    public function render_webhook_secret_field() {
        $settings = get_option($this->option_name, array());
        $value = isset($settings['webhook_secret']) ? $settings['webhook_secret'] : '';
        ?>
        <input type="text" name="<?php echo $this->option_name; ?>[webhook_secret]" 
               value="<?php echo esc_attr($value); ?>" 
               class="regular-text" 
               placeholder="Optional secret key">
        <p class="description">Optional secret key for webhook authentication.</p>
        <?php
    }
    
    /**
     * Send webhook notification
     */
    private function send_webhook($payload) {
        if (empty($this->webhook_url)) {
            error_log('Next.js Webhook: No webhook URL configured');
            return false;
        }
        
        // Add timestamp
        $payload['timestamp'] = current_time('c');
        
        // Add current user info
        $current_user = wp_get_current_user();
        if ($current_user->ID) {
            $payload['user_id'] = $current_user->ID;
            $payload['user_login'] = $current_user->user_login;
            $payload['user_email'] = $current_user->user_email;
        }
        
        // Build headers
        $headers = array(
            'Content-Type' => 'application/json',
        );
        
        // Add secret if configured
        if (!empty($this->webhook_secret)) {
            $headers['X-Webhook-Secret'] = $this->webhook_secret;
        }
        
        // Send webhook
        $response = wp_remote_post($this->webhook_url, array(
            'headers' => $headers,
            'body' => json_encode($payload),
            'timeout' => 10,
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            error_log('Next.js Webhook Error: ' . $response->get_error_message());
            return false;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        if ($response_code !== 200) {
            error_log("Next.js Webhook Error: HTTP $response_code - $response_body");
            return false;
        }
        
        error_log('Next.js Webhook Success: ' . $response_body);
        return true;
    }
    
    /**
     * Handle post publish
     */
    public function on_post_publish($post_id, $post) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }
        
        $this->send_webhook(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'post_status' => 'publish',
            'post_type' => $post->post_type,
        ));
    }
    
    /**
     * Handle post save (for status changes)
     */
    public function on_post_save($post_id, $post, $update) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }
        
        // Skip if this is a new post (handled by publish hook)
        if (!$update) {
            return;
        }
        
        // Only send for relevant post types
        if (!in_array($post->post_type, array('post', 'page', 'downloads'))) {
            return;
        }
        
        // Check for slug change
        $old_slug = get_post_meta($post_id, '_old_slug', true);
        
        $this->send_webhook(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'post_status' => $post->post_status,
            'post_type' => $post->post_type,
            'old_slug' => $old_slug ? $old_slug : null,
            'new_slug' => $post->post_name,
        ));
    }
    
    /**
     * Handle post delete
     */
    public function on_post_delete($post_id) {
        $post = get_post($post_id);
        if (!$post || !in_array($post->post_type, array('post', 'page', 'downloads'))) {
            return;
        }
        
        $this->send_webhook(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'post_status' => 'trash',
            'post_type' => $post->post_type,
        ));
    }
    
    /**
     * Handle post trash
     */
    public function on_post_trash($post_id) {
        $this->on_post_delete($post_id);
    }
    
    /**
     * Handle post untrash
     */
    public function on_post_untrash($post_id) {
        $post = get_post($post_id);
        if (!$post) {
            return;
        }
        
        $this->send_webhook(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'post_status' => 'publish',
            'post_type' => $post->post_type,
        ));
    }
    
    /**
     * Handle download publish
     */
    public function on_download_publish($post_id, $post) {
        $this->send_webhook(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'post_status' => 'publish',
            'post_type' => 'downloads',
        ));
    }
    
    /**
     * Handle download save
     */
    public function on_download_save($post_id, $post, $update) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }
        
        if (!$update) {
            return;
        }
        
        $this->send_webhook(array(
            'post_id' => $post_id,
            'post_title' => $post->post_title,
            'post_name' => $post->post_name,
            'post_status' => $post->post_status,
            'post_type' => 'downloads',
        ));
    }
    
    /**
     * Handle term changes (categories, tags)
     */
    public function on_term_change($term_id, $taxonomy) {
        // Send a general revalidation request for term changes
        $this->send_webhook(array(
            'post_id' => 0,
            'post_title' => 'Term Update',
            'post_name' => 'term-' . $term_id,
            'post_status' => 'publish',
            'post_type' => 'term',
            'taxonomy' => $taxonomy,
            'term_id' => $term_id,
        ));
    }
}

// Initialize plugin
add_action('plugins_loaded', function() {
    new NextJS_ISR_Webhook();
});

// AJAX handler for test webhook
add_action('wp_ajax_nextjs_test_webhook', function() {
    check_ajax_referer('nextjs_test_webhook', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Permission denied');
        return;
    }
    
    $settings = get_option('nextjs_webhook_settings', array());
    $webhook_url = isset($settings['webhook_url']) ? $settings['webhook_url'] : '';
    
    if (empty($webhook_url)) {
        wp_send_json_error('No webhook URL configured');
        return;
    }
    
    $payload = array(
        'post_id' => 0,
        'post_title' => 'Test Webhook',
        'post_name' => 'test-webhook',
        'post_status' => 'publish',
        'post_type' => 'test',
        'timestamp' => current_time('c'),
        'user_id' => get_current_user_id(),
        'user_login' => wp_get_current_user()->user_login,
        'user_email' => wp_get_current_user()->user_email,
    );
    
    $headers = array(
        'Content-Type' => 'application/json',
    );
    
    if (!empty($settings['webhook_secret'])) {
        $headers['X-Webhook-Secret'] = $settings['webhook_secret'];
    }
    
    $response = wp_remote_post($webhook_url, array(
        'headers' => $headers,
        'body' => json_encode($payload),
        'timeout' => 10,
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error('Error: ' . $response->get_error_message());
        return;
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    
    if ($response_code === 200) {
        wp_send_json_success("Webhook sent successfully! Response: $response_body");
    } else {
        wp_send_json_error("HTTP $response_code: $response_body");
    }
});


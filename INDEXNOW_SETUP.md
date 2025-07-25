# IndexNow Integration Setup Guide

This guide will help you set up IndexNow integration for faster search engine indexing of your Cowboy Kimono website.

## What is IndexNow?

IndexNow is a protocol that allows websites to instantly inform search engines about newly created, updated, or deleted web pages. This helps search engines discover and index content faster, improving your SEO performance.

## Prerequisites

1. **IndexNow Key**: You need to generate an IndexNow key
2. **Domain Access**: Ability to create a text file at your domain root
3. **Environment Variables**: Access to set environment variables in your deployment

## Step 1: Generate IndexNow Key

### Option A: Use IndexNow.org (Recommended)
1. Visit [https://www.indexnow.org/](https://www.indexnow.org/)
2. Click "Get your IndexNow key"
3. Enter your domain: `www.cowboykimono.com`
4. Generate a key (8-128 alphanumeric characters)
5. Save the key securely

### Option B: Generate Your Own
Create a random alphanumeric string between 8-128 characters. For example:
```
abc123def456ghi789
```

## Step 2: Create IndexNow Key File

Create a text file at your domain root with the filename `{your-key}.txt` containing only your IndexNow key.

**Example:**
- Filename: `abc123def456ghi789.txt`
- Content: `abc123def456ghi789`

**File Location:** `https://www.cowboykimono.com/abc123def456ghi789.txt`

**For Next.js projects:**
- Place the file in the `/public/` directory
- The file will be automatically served at the domain root
- Example: `/public/a73ecd310fdd460095648fc4ac364a53.txt`

## Step 3: Configure Environment Variables

Add the following environment variable to your deployment:

```env
NEXT_PUBLIC_INDEXNOW_KEY=your-indexnow-key-here
```

**For AWS Amplify:**
1. Go to your Amplify app dashboard
2. Navigate to Environment Variables
3. Add `NEXT_PUBLIC_INDEXNOW_KEY` with your key value
4. Redeploy your application

## Step 4: WordPress Integration (Optional)

### Install WordPress Plugin

1. Copy the `wordpress-indexnow-plugin.php` file to your WordPress site
2. Place it in `/wp-content/plugins/indexnow-integration/`
3. Activate the plugin in WordPress admin
4. Configure the webhook URL and secret in the plugin settings

### Manual WordPress Integration

If you prefer to integrate manually, you can call the webhook API directly:

```php
// Example PHP code to submit a new post
$webhook_data = array(
    'action' => 'publish',
    'post_type' => 'post',
    'post_slug' => 'my-new-post',
    'post_status' => 'publish',
    'categories' => array('fashion', 'lifestyle'),
    'tags' => array('western', 'kimono')
);

$response = wp_remote_post('https://www.cowboykimono.com/api/wordpress-webhook', array(
    'method' => 'POST',
    'headers' => array('Content-Type' => 'application/json'),
    'body' => json_encode($webhook_data)
));
```

## Step 5: Test the Integration

### Using the Debug Interface

1. Visit `https://www.cowboykimono.com/debug/indexnow`
2. Check the configuration status
3. Test URL submission with a sample URL
4. Verify the submission was successful

### Using the API Directly

Test the API endpoints:

```bash
# Test configuration
curl https://www.cowboykimono.com/api/indexnow

# Submit a URL
curl -X POST https://www.cowboykimono.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://www.cowboykimono.com/blog/example-post"],
    "searchEngines": ["google", "bing"]
  }'

# Submit WordPress content
curl -X POST https://www.cowboykimono.com/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post",
    "slug": "example-post",
    "searchEngines": ["google", "bing"]
  }'
```

## Step 6: Verify IndexNow Key File

Ensure your IndexNow key file is accessible:

```bash
curl https://www.cowboykimono.com/your-key-here.txt
```

Should return your IndexNow key.

**Troubleshooting:**
- If you get a 404 error, ensure the key file is in the `/public/` directory
- The file must be accessible at the domain root (not in a subdirectory)
- Check that the filename matches your IndexNow key exactly

## API Endpoints

### POST /api/indexnow
Submit URLs to IndexNow

**Request Body:**
```json
{
  "urls": ["https://www.cowboykimono.com/blog/example-post"],
  "searchEngines": ["google", "bing"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully submitted 1 URLs to 2 search engine(s)",
  "statusCode": 200
}
```

### POST /api/wordpress-webhook
WordPress webhook for automatic submissions

**Request Body:**
```json
{
  "action": "publish",
  "post_type": "post",
  "post_slug": "example-post",
  "post_status": "publish",
  "categories": ["fashion"],
  "tags": ["western"]
}
```

### GET /api/indexnow
Get IndexNow configuration status

**Response:**
```json
{
  "isConfigured": true,
  "key": "abc123...",
  "host": "www.cowboykimono.com",
  "keyLocation": "https://www.cowboykimono.com/abc123.txt",
  "endpoints": ["google", "bing", "yandex"]
}
```

## Supported Search Engines

- **Bing**: https://www.bing.com/indexnow (Primary - working)
- **Yandex**: https://yandex.com/indexnow (Available)
- **Google**: https://www.google.com/indexnow (Temporarily unavailable - 404 errors)

## WordPress Plugin Features

The WordPress plugin provides:

1. **Automatic Submission**: Submits new posts, categories, and tags automatically
2. **Admin Interface**: Settings page in WordPress admin
3. **Test Functionality**: Test submissions with recent posts
4. **Manual Submission**: Function for manual URL submission
5. **Error Logging**: Comprehensive error logging for debugging

## Troubleshooting

### Common Issues

1. **"IndexNow key not configured"**
   - Ensure `NEXT_PUBLIC_INDEXNOW_KEY` is set in environment variables
   - Redeploy your application after setting the variable

2. **"No valid URLs found"**
   - URLs must be from your configured domain
   - Check that URLs are properly formatted

3. **"Webhook error"**
   - Verify the webhook URL is correct
   - Check that the webhook secret matches (if configured)
   - Ensure WordPress can make external HTTP requests

4. **"Key file not accessible"**
   - Verify the key file exists at your domain root
   - Check file permissions
   - Ensure the filename matches your key exactly

### Debug Steps

1. Check the debug interface at `/debug/indexnow`
2. Verify environment variables are set correctly
3. Test the IndexNow key file accessibility
4. Check server logs for error messages
5. Test API endpoints directly with curl

## Security Considerations

1. **Webhook Secret**: Use the optional webhook secret for additional security
2. **Key Protection**: Keep your IndexNow key secure and don't expose it in client-side code
3. **URL Validation**: The system validates URLs to ensure they're from your domain
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Performance Impact

- **Minimal Overhead**: IndexNow submissions are lightweight and asynchronous
- **No User Impact**: Submissions happen in the background
- **Fast Response**: Search engines typically respond within seconds
- **Automatic Retry**: Failed submissions can be retried

## Monitoring and Analytics

- **Success Tracking**: Monitor submission success rates
- **Error Logging**: Comprehensive error logging for debugging
- **Response Times**: Track search engine response times
- **Indexing Speed**: Monitor how quickly content appears in search results

## Best Practices

1. **Submit Only New/Updated Content**: Don't submit unchanged URLs
2. **Batch Submissions**: Submit multiple URLs together when possible
3. **Monitor Success Rates**: Track submission success and failures
4. **Regular Testing**: Test the integration regularly
5. **Keep Keys Secure**: Rotate keys periodically and keep them secure

## Support

For issues or questions:

1. Check the debug interface at `/debug/indexnow`
2. Review server logs for error messages
3. Test API endpoints directly
4. Verify IndexNow key file accessibility
5. Check environment variable configuration

## Additional Resources

- [IndexNow Protocol Documentation](https://www.indexnow.org/documentation)
- [Google IndexNow Guide](https://developers.google.com/search/docs/crawling-indexing/quick-start-indexnow)
- [Bing IndexNow Guide](https://www.bing.com/webmasters/help/IndexNow-API-1c5d8c8a)
- [Yandex IndexNow Guide](https://yandex.com/support/webmaster/indexnow.html) 
# WordPress Headless CMS Setup Guide

## Overview

This guide outlines the implementation strategy for setting up a headless WordPress CMS on AWS to feed content to your Next.js Cowboy Kimono website.

## 🏗️ Architecture

### Domain Structure
```
cowboykimono.com          → Next.js frontend (Amplify)
admin.cowboykimono.com    → WordPress admin (EC2)
api.cowboykimono.com      → WordPress REST API (EC2)
```

### AWS Infrastructure
- **EC2 Instance**: WordPress CMS (t3.small/medium)
- **RDS MySQL**: Managed database
- **Route 53**: DNS management
- **CloudFront**: CDN for global delivery
- **S3**: Static asset storage
- **Amplify**: Next.js hosting

## 🚀 Phase 1: WordPress Setup on AWS

### 1. Launch EC2 Instance
```bash
# Recommended specs
Instance Type: t3.small or t3.medium
Storage: 20GB GP3
Security Group: HTTP(80), HTTPS(443), SSH(22)
```

### 2. Install LAMP Stack
```bash
# Update system
sudo yum update -y

# Install Apache, MySQL, PHP
sudo yum install -y httpd mysql php php-mysql php-gd php-mbstring php-xml php-curl

# Start and enable services
sudo systemctl start httpd
sudo systemctl enable httpd
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 3. Install WordPress
```bash
# Download WordPress
cd /var/www/html
sudo wget https://wordpress.org/latest.tar.gz
sudo tar -xzf latest.tar.gz
sudo chown -R apache:apache wordpress/
sudo chmod -R 755 wordpress/

# Configure virtual host
sudo nano /etc/httpd/conf.d/wordpress.conf
```

### 4. Virtual Host Configuration
```apache
<VirtualHost *:80>
    ServerName admin.cowboykimono.com
    DocumentRoot /var/www/html/wordpress
    
    <Directory /var/www/html/wordpress>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog logs/wordpress_error.log
    CustomLog logs/wordpress_access.log combined
</VirtualHost>
```

### 5. Configure WordPress for Headless

#### Install Essential Plugins
1. **Advanced Custom Fields (ACF)** - Custom fields
2. **WP REST API** - Enhanced API functionality
3. **JWT Authentication** - Secure API access
4. **CORS Headers** - Enable cross-origin requests
5. **Yoast SEO** - SEO metadata
6. **Disable Frontend** - Optional headless theme

#### Configure REST API
```php
// Add to wp-config.php or functions.php
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);

// Enable CORS
add_action('init', function() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
});
```

## 🔧 Phase 2: Next.js Integration

### 1. Environment Variables
Create `.env.local`:
```env
# WordPress API Configuration
NEXT_PUBLIC_WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_MEDIA_URL=https://api.cowboykimono.com/wp-content/uploads

# Existing variables
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VYVT6J7XLS
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
```

### 2. Update Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: [
      'api.cowboykimono.com',
      'admin.cowboykimono.com'
    ],
  },
  // ... existing config
};
```

### 3. WordPress API Integration
The project now includes:
- `app/lib/wordpress.ts` - API utilities
- `app/components/WordPressBlog.tsx` - Blog component
- TypeScript interfaces for WordPress data

### 4. Update Blog Pages
Replace static blog content with WordPress data:

```typescript
// app/blog/page.tsx
import WordPressBlog from '../components/WordPressBlog';

export default function BlogPage() {
  return (
    <div>
      <WordPressBlog postsPerPage={9} />
    </div>
  );
}
```

## 📝 Phase 3: Content Management

### WordPress Admin Setup
1. **Create Content Types**:
   - Blog Posts
   - Product Pages
   - About Page
   - Download Resources

2. **Custom Fields (ACF)**:
   - Featured Image
   - SEO Description
   - Product Price
   - Download Links

3. **Categories & Tags**:
   - Craft Tutorials
   - Product Showcase
   - Artist Stories
   - Sustainability

### Content Workflow
1. **Create in WordPress Admin**
2. **Publish/Update Content**
3. **Next.js fetches via API**
4. **Static generation for performance**

## 🔒 Phase 4: Security & Performance

### Security Measures
1. **HTTPS Only**: Configure SSL certificates
2. **API Rate Limiting**: Prevent abuse
3. **CORS Configuration**: Restrict origins
4. **Authentication**: JWT for admin access
5. **Regular Updates**: WordPress core and plugins

### Performance Optimization
1. **Caching**: Redis/Memcached
2. **CDN**: CloudFront for global delivery
3. **Image Optimization**: WebP conversion
4. **Database Optimization**: Query optimization
5. **Static Generation**: Pre-render pages

## 🚀 Phase 5: Deployment

### AWS Setup
1. **Route 53**: Configure DNS records
2. **SSL Certificates**: ACM certificates
3. **CloudFront**: CDN distribution
4. **S3**: Static asset storage
5. **Amplify**: Next.js deployment

### Environment Configuration
```bash
# Production environment variables
NEXT_PUBLIC_WORDPRESS_API_URL=https://api.cowboykimono.com/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_MEDIA_URL=https://api.cowboykimono.com/wp-content/uploads
```

## 📊 Monitoring & Maintenance

### Monitoring
1. **CloudWatch**: AWS monitoring
2. **Uptime Monitoring**: Site availability
3. **Performance Monitoring**: Page load times
4. **Error Tracking**: Application errors

### Maintenance
1. **Regular Backups**: Database and files
2. **Security Updates**: WordPress and plugins
3. **Performance Reviews**: Monthly optimization
4. **Content Updates**: Regular content refresh

## 🔄 Migration Strategy

### From Static to WordPress
1. **Export Current Content**: Blog posts, pages
2. **Import to WordPress**: Bulk import
3. **Update URLs**: Redirect old URLs
4. **Test Integration**: Verify API calls
5. **Go Live**: Switch to WordPress content

### Rollback Plan
1. **Keep Static Version**: Backup current site
2. **Gradual Migration**: Page by page
3. **Fallback Content**: Static fallbacks
4. **Monitoring**: Watch for issues

## 📚 Additional Resources

### WordPress Headless Resources
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Headless WordPress Guide](https://headlesswp.com/)
- [ACF Documentation](https://www.advancedcustomfields.com/resources/)

### AWS Resources
- [EC2 WordPress Setup](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/install-LAMP.html)
- [Route 53 DNS](https://docs.aws.amazon.com/Route53/)
- [CloudFront CDN](https://docs.aws.amazon.com/AmazonCloudFront/)

### Next.js Integration
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🎯 Success Metrics

### Performance Targets
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Uptime**: > 99.9%
- **SEO Score**: > 90

### Content Management
- **Easy Content Updates**: Non-technical users
- **Rich Media Support**: Images, videos, downloads
- **SEO Optimization**: Meta tags, structured data
- **Multi-user Access**: Team collaboration

This setup provides a robust, scalable headless CMS solution that maintains the performance benefits of Next.js while offering the content management flexibility of WordPress. 
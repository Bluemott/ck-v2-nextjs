# 🔒 HTTPS & Subdomain Fix Action Plan

## 🚨 **Current Issues**
1. **SSL Certificate Mismatch**: Certificate only covers `api.cowboykimono.com`, not `admin.cowboykimono.com`
2. **404 Errors**: Subdomains showing default Debian page instead of WordPress
3. **HTTPS Not Working**: One subdomain works with HTTPS, the other doesn't

## 🎯 **Solution Overview**
We need to:
1. Create a new SSL certificate covering both subdomains
2. Configure Apache virtual hosts properly
3. Ensure WordPress is serving content correctly
4. Test and verify HTTPS functionality

---

## 📋 **Step-by-Step Action Plan**

### **Step 1: Create New SSL Certificate**

#### **Option A: AWS CLI (Recommended)**
```bash
# Delete old certificate
aws lightsail delete-certificate --certificate-name api-cowboykimono-com --region us-east-1

# Create new certificate covering both domains
aws lightsail create-certificate \
  --certificate-name cowboykimono-subdomains \
  --domain-name api.cowboykimono.com \
  --subject-alternative-names admin.cowboykimono.com \
  --region us-east-1

# Verify certificate creation
aws lightsail get-certificates --region us-east-1

# Attach to your instance
aws lightsail attach-certificate-to-distribution \
  --distribution-name CowboyKimonoWP \
  --certificate-name cowboykimono-subdomains \
  --region us-east-1
```

#### **Option B: Lightsail Console**
1. Go to AWS Lightsail Console
2. Navigate to "Certificates" section
3. Click "Create certificate"
4. Enter domain name: `api.cowboykimono.com`
5. Add alternative names: `admin.cowboykimono.com`
6. Complete the certificate creation
7. Attach the certificate to your instance

### **Step 2: Configure Apache Virtual Hosts**

SSH into your Lightsail instance:
```bash
ssh -i LightsailWP.pem bitnami@34.194.14.49
```

#### **Check Current Configuration**
```bash
# Check current SSL configuration
sudo cat /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf

# Check if SSL module is loaded
sudo /opt/bitnami/apache2/bin/httpd -M | grep ssl

# Check current virtual hosts
sudo /opt/bitnami/apache2/bin/httpd -S
```

#### **Create SSL Virtual Host Configuration**
```bash
# Backup current configuration
sudo cp /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf.backup

# Edit SSL virtual hosts configuration
sudo nano /opt/bitnami/apache2/conf/bitnami/bitnami-ssl-vhosts.conf
```

#### **Add This Configuration**
```apache
<VirtualHost *:443>
    ServerName api.cowboykimono.com
    ServerAlias admin.cowboykimono.com
    DocumentRoot /opt/bitnami/wordpress
    
    SSLEngine on
    SSLCertificateFile /opt/bitnami/apache2/conf/server.crt
    SSLCertificateKeyFile /opt/bitnami/apache2/conf/server.key
    
    <Directory "/opt/bitnami/wordpress">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # WordPress rewrite rules
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.php$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.php [L]
    </IfModule>
</VirtualHost>
```

#### **Restart Apache**
```bash
# Test configuration
sudo /opt/bitnami/apache2/bin/httpd -t

# Restart Apache
sudo /opt/bitnami/ctlscript.sh restart apache

# Check status
sudo /opt/bitnami/ctlscript.sh status
```

### **Step 3: Test HTTPS Configuration**

#### **Test Commands**
```bash
# Test HTTPS endpoints
curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts
curl -I https://admin.cowboykimono.com/wp-admin

# Test SSL certificate
openssl s_client -connect api.cowboykimono.com:443 -servername api.cowboykimono.com
openssl s_client -connect admin.cowboykimono.com:443 -servername admin.cowboykimono.com
```

#### **Check Apache Logs**
```bash
# Check error logs
sudo tail -f /opt/bitnami/apache2/logs/error_log

# Check access logs
sudo tail -f /opt/bitnami/apache2/logs/access_log
```

### **Step 4: Update Environment Variables**

Once HTTPS is working, update your `.env.local` file:
```bash
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
NEXT_PUBLIC_WORDPRESS_ADMIN_URL=https://admin.cowboykimono.com
```

### **Step 5: Test Your Next.js Application**

```bash
# Test locally
npm run dev
# Visit http://localhost:3000/test-rest-api

# Deploy to production
npm run build
# Deploy via Amplify
```

---

## 🔍 **Troubleshooting**

### **If HTTPS Still Doesn't Work:**

1. **Check Certificate Status**
   ```bash
   aws lightsail get-certificates --region us-east-1
   ```

2. **Verify DNS Propagation**
   ```bash
   nslookup api.cowboykimono.com
   nslookup admin.cowboykimono.com
   ```

3. **Check Apache Configuration**
   ```bash
   sudo /opt/bitnami/apache2/bin/httpd -t
   sudo /opt/bitnami/ctlscript.sh status
   ```

4. **Check SSL Module**
   ```bash
   sudo /opt/bitnami/apache2/bin/httpd -M | grep ssl
   ```

5. **Verify Virtual Hosts**
   ```bash
   sudo /opt/bitnami/apache2/bin/httpd -S
   ```

### **If You See Default Debian Page:**

1. **Check DocumentRoot**
   ```bash
   ls -la /opt/bitnami/wordpress/
   ```

2. **Verify WordPress Installation**
   ```bash
   sudo cat /opt/bitnami/wordpress/wp-config.php
   ```

3. **Check Apache Default Site**
   ```bash
   sudo cat /opt/bitnami/apache2/conf/httpd.conf | grep DocumentRoot
   ```

---

## ✅ **Success Criteria**

Your setup is working correctly when:

1. ✅ `https://api.cowboykimono.com/wp-json/wp/v2/posts` returns JSON data
2. ✅ `https://admin.cowboykimono.com/wp-admin` shows WordPress admin
3. ✅ No SSL certificate errors in browser
4. ✅ No default Debian page
5. ✅ Your Next.js app can connect to both endpoints

---

## 🚀 **Quick Test Script**

Run this to test your setup:
```bash
node scripts/configure-https-lightsail.js
```

---

**Created**: January 2025  
**Status**: Ready for implementation  
**Priority**: High - Fixes production HTTPS issues 
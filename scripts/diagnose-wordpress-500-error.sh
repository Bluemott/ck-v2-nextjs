#!/bin/bash

# WordPress 500 Error Diagnostic Script
# Run this on your WordPress server to find what's causing the 500 error

echo "🔍 WordPress 500 Error Diagnostic"
echo "=================================="
echo ""

WORDPRESS_ROOT="/opt/bitnami/wordpress"

cd "$WORDPRESS_ROOT" || exit 1

echo "1. Checking error logs..."
echo "------------------------"
if [ -f "/opt/bitnami/apache/logs/error_log" ]; then
    echo "Last 20 Apache errors:"
    sudo tail -20 /opt/bitnami/apache/logs/error_log
fi

if [ -f "/opt/bitnami/php/logs/error_log" ]; then
    echo ""
    echo "Last 20 PHP errors:"
    sudo tail -20 /opt/bitnami/php/logs/error_log
fi

if [ -f "wp-content/debug.log" ]; then
    echo ""
    echo "Last 20 WordPress debug log entries:"
    tail -20 wp-content/debug.log
fi

echo ""
echo "2. Checking .htaccess syntax..."
echo "------------------------------"
if [ -f ".htaccess" ]; then
    echo "Checking Apache syntax..."
    sudo apachectl configtest 2>&1 | head -20
else
    echo "No .htaccess file found"
fi

echo ""
echo "3. Checking for custom mu-plugins..."
echo "-----------------------------------"
if [ -d "wp-content/mu-plugins" ]; then
    echo "Files in mu-plugins:"
    ls -la wp-content/mu-plugins/
    echo ""
    echo "Content of mu-plugins files:"
    for file in wp-content/mu-plugins/*.php; do
        if [ -f "$file" ]; then
            echo "--- $file ---"
            head -30 "$file"
            echo ""
        fi
    done
else
    echo "No mu-plugins directory"
fi

echo ""
echo "4. Checking wp-config.php for custom code..."
echo "-------------------------------------------"
echo "Last 30 lines of wp-config.php:"
sudo tail -30 wp-config.php

echo ""
echo "5. Checking recent .htaccess changes..."
echo "--------------------------------------"
if [ -f ".htaccess" ]; then
    echo "Last 50 lines of .htaccess:"
    tail -50 .htaccess
fi

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "1. Look at the error logs above to find the specific error"
echo "2. Check the .htaccess file for syntax errors"
echo "3. Remove any custom code causing issues"
echo "4. Restart Apache: sudo /opt/bitnami/ctlscript.sh restart apache"


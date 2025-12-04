#!/bin/bash

# Script to remove <LocationMatch> block from .htaccess
# This block causes the error: "<LocationMatch not allowed here"

cd /opt/bitnami/wordpress || exit 1

# Backup first
echo "Creating backup..."
sudo cp .htaccess .htaccess.backup-$(date +%Y%m%d_%H%M%S)

echo "Removing <LocationMatch> block from .htaccess..."

# Create a temporary file without the LocationMatch block
sudo awk '
/^<IfModule mod_headers.c>/ {
    in_headers_block = 1
    print $0
    next
}
in_headers_block && /^<LocationMatch/ {
    in_locationmatch = 1
    next
}
in_locationmatch && /^<\/LocationMatch>/ {
    in_locationmatch = 0
    next
}
in_locationmatch {
    next
}
in_headers_block && /^<\/IfModule>/ {
    in_headers_block = 0
    if (!in_locationmatch) {
        print $0
    }
    next
}
{
    print $0
}
' .htaccess > .htaccess.tmp

# Replace the file
sudo mv .htaccess.tmp .htaccess
sudo chown bitnami:daemon .htaccess
sudo chmod 644 .htaccess

echo "Done! <LocationMatch> block removed."
echo ""
echo "Testing Apache syntax..."
sudo apachectl configtest

echo ""
echo "If syntax is OK, restart Apache:"
echo "  sudo /opt/bitnami/ctlscript.sh restart apache"


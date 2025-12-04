# Lightsail WordPress Instance Recovery Runbook

**Last Updated:** 2025-01-26  
**Status:** Active Recovery Procedures  
**Instance:** WordPress on AWS Lightsail  
**API URL:** https://api.cowboykimono.com

---

## Quick Reference

### Emergency Contacts

- **AWS Support:** https://console.aws.amazon.com/support
- **Lightsail Console:** https://lightsail.aws.amazon.com
- **Instance IP:** 44.212.45.1 (verify in console)
- **Recovery Time Objective (RTO):** 30-60 minutes
- **Recovery Point Objective (RPO):** Last snapshot

### Common Symptoms

- SSH connection timeouts
- WordPress API returning 500/501 errors
- AWS Systems Manager not accessible
- Instance shows "running" but not responding

---

## Phase 1: Immediate Diagnosis (5-15 minutes)

### Step 1.1: Run Diagnostic Checks

**Manual Diagnostic Commands:**

```powershell
# Test SSH connectivity (from local machine)
Test-NetConnection -ComputerName 44.212.45.1 -Port 22

# Test HTTPS connectivity
Test-NetConnection -ComputerName 44.212.45.1 -Port 443

# Test WordPress API
curl https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1
```

**Or use monitoring script:**

```powershell
# Continuous monitoring (if configured)
powershell -ExecutionPolicy Bypass -File scripts/monitor-lightsail-connectivity.ps1 -InstanceIP "44.212.45.1" -APIUrl "https://api.cowboykimono.com"
```

**Expected Output:**

- Port 22 (SSH): Should show OPEN
- Port 443 (HTTPS): Should show OPEN
- WordPress API: Should return 200 status with JSON data

**If Failed:**

- Document error messages
- Note which ports are blocked
- Proceed to Step 1.2

### Step 1.2: Check Lightsail Console

**Access:** https://lightsail.aws.amazon.com → Your Instance

**Checks to Perform:**

1. **Instance Status:**
   - Status should be "Running"
   - If "Stopped" or "Stopping", wait for it to fully stop, then start
   - If "Error", create snapshot and contact AWS support

2. **Metrics Tab:**
   - CPU Utilization: Should be < 80%
   - Memory Utilization: Should be < 90%
   - Network In/Out: Should show activity
   - If metrics show 0 or spikes, indicates issue

3. **Networking Tab:**
   - Verify firewall rules exist:
     - SSH (22) - TCP - Allow from 0.0.0.0/0
     - HTTPS (443) - TCP - Allow from 0.0.0.0/0
   - Rules should show as "Active"
   - If rules missing or inactive, proceed to Phase 2

4. **Logs Tab:**
   - Check for error messages
   - Look for PHP errors, database errors
   - Note any recent changes

### Step 1.3: Verify Firewall Rules

**Action:** Go to Networking tab → Firewall rules

**Required Rules:**

```
SSH (22)
- Protocol: TCP
- Application: SSH
- Source: 0.0.0.0/0 (or your specific IP for security)
- Status: Active

HTTPS (443)
- Protocol: TCP
- Application: HTTPS
- Source: 0.0.0.0/0
- Status: Active
```

**If Rules Missing or Inactive:**

- Proceed to Phase 2, Step 2.2

---

## Phase 2: Recovery Procedures (30-60 minutes)

### Step 2.1: Instance Restart

**When to Use:** Instance is running but unresponsive

**Procedure:**

1. **Stop Instance:**
   - Lightsail Console → Your Instance
   - Click "Stop" button
   - Wait for status to change to "Stopped" (2-3 minutes)
   - **DO NOT** force stop unless absolutely necessary

2. **Wait Period:**
   - Wait 2-3 minutes after instance fully stops
   - This allows network state to reset

3. **Start Instance:**
   - Click "Start" button
   - Wait for status to change to "Running" (2-3 minutes)
   - Wait additional 2-3 minutes for services to initialize

4. **Verify Services:**
   - WordPress should be accessible
   - MySQL should be running
   - Apache/Nginx should be running

5. **Test Connectivity:**

   ```powershell
   # Test SSH
   Test-NetConnection -ComputerName 44.212.45.1 -Port 22

   # Test HTTPS
   Test-NetConnection -ComputerName 44.212.45.1 -Port 443

   # Test WordPress API
   curl https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1
   ```

**Success Criteria:**

- ✅ SSH port 22 accessible
- ✅ HTTPS port 443 accessible
- ✅ WordPress API returns 200 status

**If Still Failing:**

- Proceed to Step 2.2

### Step 2.2: Enhanced Firewall Rule Re-application

**When to Use:** Restart didn't fix connectivity issues

**Procedure:**

1. **Remove All Firewall Rules:**
   - Go to Networking tab
   - Click on SSH (22) rule → Delete
   - Click on HTTPS (443) rule → Delete
   - Wait 30 seconds for changes to propagate

2. **Re-add Firewall Rules:**
   - Click "Add rule" or "Create rule"
   - **Add SSH Rule:**
     - Application: SSH
     - Port: 22
     - Protocol: TCP
     - Source: 0.0.0.0/0 (temporarily for testing)
     - Click "Create"
   - **Add HTTPS Rule:**
     - Application: HTTPS
     - Port: 443
     - Protocol: TCP
     - Source: 0.0.0.0/0
     - Click "Create"

3. **Wait for Propagation:**
   - Wait 1-2 minutes for rules to become active
   - Check that rules show as "Active" in console
   - Wait additional 2 minutes

4. **Test Connectivity:**

   ```powershell
   # Test SSH connectivity
   Test-NetConnection -ComputerName 44.212.45.1 -Port 22

   # Test HTTPS connectivity
   Test-NetConnection -ComputerName 44.212.45.1 -Port 443
   ```

**Success Criteria:**

- ✅ Firewall rules show as "Active"
- ✅ Port 22 test passes
- ✅ Port 443 test passes

**If Still Failing:**

- Proceed to Step 2.3

### Step 2.3: Access WordPress Logs

**When to Use:** Firewall is working but API still returns 500/501 errors

**Access Methods:**

**Method 1: Via Lightsail Console Logs**

- Lightsail Console → Your Instance → Logs tab
- Check for error messages
- Look for PHP errors, database errors

**Method 2: Via Snapshot (If SSH not available)**

1. Create snapshot of current instance
2. Launch new instance from snapshot
3. Access WordPress files via new instance
4. Check logs, then delete temporary instance

**Logs to Check:**

1. **WordPress Debug Log:**
   - Location: `wp-content/debug.log`
   - Check for PHP errors, plugin conflicts
   - Look for memory exhaustion errors

2. **PHP Error Log:**
   - Location: `/var/log/php/error.log` (varies by installation)
   - Check for PHP fatal errors
   - Look for memory limit issues

3. **Apache/Nginx Error Log:**
   - Apache: `/var/log/apache2/error.log`
   - Nginx: `/var/log/nginx/error.log`
   - Check for web server errors

4. **MySQL Error Log:**
   - Location: `/var/log/mysql/error.log`
   - Check for database connection errors
   - Look for query failures

**Common Issues Found in Logs:**

- **PHP Memory Exhaustion:**
  - Error: "Fatal error: Allowed memory size exhausted"
  - Fix: Increase PHP memory limit in `php.ini` or `wp-config.php`

- **Database Connection Failure:**
  - Error: "Error establishing database connection"
  - Fix: Check database credentials in `wp-config.php`
  - Verify MySQL service is running

- **Plugin Conflicts:**
  - Error: Plugin-specific errors
  - Fix: Disable problematic plugins

- **Disk Space Full:**
  - Error: "No space left on device"
  - Fix: Free up disk space, delete old logs

### Step 2.4: WordPress-Specific Recovery

**When to Use:** WordPress application issues identified

**Procedure:**

1. **Create Snapshot:**
   - Lightsail Console → Your Instance → Snapshots
   - Click "Create snapshot"
   - Wait for snapshot to complete

2. **Launch New Instance from Snapshot:**
   - Go to Snapshots tab
   - Select snapshot → Create new instance
   - Use same instance size
   - Attach static IP if available

3. **Access WordPress Files:**
   - SSH into new instance
   - Navigate to WordPress directory (usually `/opt/bitnami/wordpress` or `/var/www/html`)

4. **Check Configuration Files:**

   ```bash
   # Check wp-config.php for errors
   cat wp-config.php | grep -i "define\|DB_"

   # Check .htaccess for syntax errors
   apachectl configtest
   # or
   nginx -t
   ```

5. **Disable Problematic Plugins:**

   ```bash
   # Rename plugins directory to disable all
   mv wp-content/plugins wp-content/plugins-disabled

   # Or disable specific plugin
   mv wp-content/plugins/problematic-plugin wp-content/plugins/problematic-plugin-disabled
   ```

6. **Increase PHP Memory Limit:**

   ```bash
   # Edit wp-config.php
   # Add before "That's all, stop editing!"
   define('WP_MEMORY_LIMIT', '256M');
   define('WP_MAX_MEMORY_LIMIT', '512M');
   ```

7. **Check Disk Space:**

   ```bash
   df -h
   # Free up space if needed
   ```

8. **Restart Services:**

   ```bash
   # Bitnami installations
   sudo /opt/bitnami/ctlscript.sh restart

   # Standard installations
   sudo systemctl restart apache2
   # or
   sudo systemctl restart nginx
   sudo systemctl restart mysql
   ```

9. **Test WordPress:**
   - Access WordPress admin: https://admin.cowboykimono.com/wp-admin
   - Test API: https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1

10. **If Successful:**
    - Update DNS to point to new instance (if using new IP)
    - Update firewall rules
    - Monitor for 30 minutes
    - Delete old instance after verification

---

## Phase 3: Verification & Monitoring (15-30 minutes)

### Step 3.1: Verify All Services

**Checklist:**

- [ ] SSH access working (port 22)
- [ ] HTTPS access working (port 443)
- [ ] WordPress API returns 200 status
- [ ] WordPress admin accessible
- [ ] Database connections working
- [ ] No errors in logs

### Step 3.2: Run Full Diagnostic Suite

```powershell
# Connectivity test
Test-NetConnection -ComputerName 44.212.45.1 -Port 22
Test-NetConnection -ComputerName 44.212.45.1 -Port 443

# API test
curl https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1

# Health check endpoint
curl https://cowboykimono.com/api/health
```

### Step 3.3: Monitor for Stability

**Duration:** 30 minutes minimum

**Actions:**

- Watch for any recurring errors
- Monitor CPU and memory usage
- Check network traffic
- Verify API responses

**If Issues Recur:**

- Document pattern
- Consider root cause analysis
- Proceed to Phase 4

---

## Phase 4: Prevention Setup (After Recovery)

### Step 4.1: Enable Automated Monitoring

**Setup Monitoring Script:**

```powershell
# Test monitoring script
powershell -ExecutionPolicy Bypass -File scripts/monitor-lightsail-connectivity.ps1 `
    -InstanceIP "34.194.14.49" `
    -APIUrl "https://api.cowboykimono.com" `
    -CheckInterval 300 `
    -EmailTo "your-email@example.com" `
    -SMTPServer "smtp.gmail.com" `
    -SMTPPort "587" `
    -SMTPUser "your-email@gmail.com" `
    -SMTPPassword "your-app-password"
```

**Schedule as Windows Task:**

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily, repeat every 5 minutes
4. Action: Start program
5. Program: `powershell.exe`
6. Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\scripts\monitor-lightsail-connectivity.ps1"`

### Step 4.2: Set Up CloudWatch Alarms

**Use Setup Script:**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-cloudwatch-alarms.ps1
```

**Manual Setup:**

1. AWS Console → CloudWatch → Alarms
2. Create alarm for:
   - Instance status check failed
   - Network in/out = 0
   - High CPU (> 80%)
   - High memory (> 90%)
3. Configure SNS topic for notifications

### Step 4.3: Configure Static IP

**Procedure:**

1. Lightsail Console → Networking → Static IPs
2. Create static IP
3. Attach to WordPress instance
4. Update DNS records if needed
5. Update firewall rules

---

## Diagnostic Command Reference

### Connectivity Tests

```powershell
# Test SSH port
Test-NetConnection -ComputerName 34.194.14.49 -Port 22

# Test HTTPS port
Test-NetConnection -ComputerName 34.194.14.49 -Port 443

# Test WordPress API
Invoke-WebRequest -Uri "https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1"
```

### WordPress Checks

```bash
# Check WordPress version
wp core version

# Check plugin status
wp plugin list

# Check database connection
wp db check

# Check disk space
df -h

# Check memory usage
free -h
```

### Service Status

```bash
# Bitnami installations
sudo /opt/bitnami/ctlscript.sh status

# Standard installations
sudo systemctl status apache2
sudo systemctl status nginx
sudo systemctl status mysql
```

---

## Escalation Procedures

### Level 1: Automated Recovery (0-15 minutes)

- Run diagnostic scripts
- Attempt instance restart
- Re-apply firewall rules

### Level 2: Manual Intervention (15-60 minutes)

- Access logs via snapshot
- Fix WordPress configuration
- Disable problematic plugins
- Increase resource limits

### Level 3: AWS Support (60+ minutes)

- If all recovery procedures fail
- Contact AWS Support with:
  - Instance ID
  - Snapshot ID
  - Error logs
  - Steps already attempted

---

## Prevention Checklist

### Daily

- [ ] Monitor automated connectivity checks
- [ ] Review error logs
- [ ] Check resource utilization

### Weekly

- [ ] Run full diagnostic suite
- [ ] Review CloudWatch alarms
- [ ] Verify backup snapshots
- [ ] Run `scripts/diagnose-lightsail-crashes.ps1`

### Monthly

- [ ] **CRITICAL: Schedule maintenance restart** (First Sunday, 2-3 AM)
- [ ] Run `scripts/preventive-maintenance.ps1` before restart
- [ ] Create snapshot before maintenance
- [ ] Review firewall rules
- [ ] Update WordPress and plugins
- [ ] Review and optimize database
- [ ] Check disk space and memory usage
- [ ] Review WordPress logs for errors

---

## Recovery Time Estimates

| Phase        | Estimated Time | Description                  |
| ------------ | -------------- | ---------------------------- |
| Diagnosis    | 5-15 min       | Identify issue               |
| Recovery     | 30-60 min      | Fix connectivity/application |
| Verification | 15-30 min      | Confirm stability            |
| Prevention   | 30-60 min      | Set up monitoring            |

**Total Recovery Time:** 1.5 - 2.5 hours

---

## Notes

- Always create snapshot before making changes
- Document all changes made during recovery
- Update this runbook with lessons learned
- Keep AWS credentials secure
- Test recovery procedures in non-production first

---

**Related Files:**

- `scripts/monitor-lightsail-connectivity.ps1` - Continuous monitoring
- `scripts/preventive-maintenance.ps1` - Monthly maintenance procedures
- `scripts/setup-cloudwatch-alarms.ps1` - CloudWatch alarm setup
- `scripts/preventive-maintenance.ps1` - Monthly maintenance script
- `scripts/setup-cloudwatch-alarms.ps1` - CloudWatch setup
- `DOCUMENTATION.md` - Complete project documentation
- `LIGHTSAIL_FIREWALL_PREVENTION.md` - Prevention strategies
- `LIGHTSAIL_CRASH_ROOT_CAUSE.md` - Root cause analysis

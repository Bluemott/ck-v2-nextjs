# Lightsail Firewall Issues - Root Cause & Prevention

## Issue Summary
**Date:** 2025-01-25  
**Problem:** Lightsail firewall rules (ports 22 and 443) stopped working despite appearing correct in console  
**Symptoms:** SSH timeouts, API 500/501 errors, all ports blocked  
**Resolution:** Re-applied firewall rules and restarted instance

## Root Cause Analysis

Based on AWS Lightsail behavior and common issues:

### 1. **Firewall Rule Sync Issues** (Most Likely)
AWS Lightsail firewall rules are managed at the platform level but must sync with the instance's network configuration. Sometimes this sync fails:

**Causes:**
- Instance reboot during firewall rule update
- Network state change (IP change, static IP attachment/detachment)
- AWS infrastructure updates in the region
- Firewall rule applied but not propagated to instance

**Evidence:**
- Rules showed as "active" in console but ports were blocked
- Re-applying rules + restart fixed the issue
- Common in Lightsail instances after updates/reboots

### 2. **Instance Network State Stale**
The instance's internal network state can become out of sync with Lightsail's firewall configuration:

**Causes:**
- Long-running instance (weeks/months without restart)
- Network driver issues
- iptables/ufw configuration conflicts

**Evidence:**
- Restart fixed it (refreshed network state)

### 3. **Lightsail Platform Updates**
AWS periodically updates Lightsail infrastructure, which can temporarily affect firewall rule application:

**Causes:**
- Scheduled AWS maintenance
- Region infrastructure updates
- Platform service updates

## Prevention Strategies

### 1. **Automated Monitoring** ✅ **RECOMMENDED**

Set up automated connectivity monitoring to detect issues early:

**PowerShell Script:** `scripts/monitor-lightsail-connectivity.ps1`

```powershell
# Run continuous monitoring (checks every 5 minutes)
powershell -ExecutionPolicy Bypass -File scripts/monitor-lightsail-connectivity.ps1

# Or run as scheduled task (Windows Task Scheduler)
```

**Features:**
- Checks SSH (port 22) connectivity
- Checks HTTPS (port 443) connectivity  
- Checks WordPress API endpoint
- Alerts after 3 consecutive failures
- Logs all checks for analysis

**Enhancement Ideas:**
- Send alerts via email/SNS when failures detected
- Create CloudWatch alarms
- Auto-trigger firewall rule re-application script

### 2. **Regular Health Checks**

Run periodic diagnostic checks:

```powershell
# Weekly health check
powershell -ExecutionPolicy Bypass -File scripts/test-ssh-connection.ps1

# API connectivity check
node scripts/diagnose-api-errors.js
```

**Schedule:**
- Daily: Automated monitoring (see above)
- Weekly: Full diagnostic check
- After any instance changes: Immediate verification

### 3. **Firewall Rule Best Practices**

**Use Static IP:**
- Static IPs are more stable than auto-assigned IPs
- Less likely to have network state issues
- Easier to monitor and verify

**Document Firewall Rules:**
- Keep a record of required firewall rules
- Document any changes
- Use Infrastructure as Code (IaC) if possible

**Verify After Changes:**
- Always verify firewall rules after any instance changes
- Test connectivity immediately after firewall updates
- Don't assume rules are active just because console shows them

### 4. **Automated Firewall Rule Verification**

Create a script that verifies firewall rules are actually working:

```powershell
# Verify firewall rules are active
# If ports are blocked, automatically re-apply rules
```

### 5. **Proactive Restarts**

Schedule periodic instance restarts to refresh network state:

**Recommendation:**
- Monthly maintenance window
- Restart instance to clear any stale network state
- Verify connectivity after restart

### 6. **CloudWatch Integration**

Set up CloudWatch alarms for connectivity:

**Metrics to Monitor:**
- Instance status checks
- Network in/out (if drops to 0, connectivity issue)
- Custom metrics from health checks

**Alarms:**
- Alert if instance unreachable
- Alert if API endpoints fail
- Alert on network metric anomalies

### 7. **Backup Access Methods**

Always have alternative ways to access your instance:

1. **AWS Systems Manager:**
   - Browser-based terminal (no SSH needed)
   - Works even if SSH is blocked
   - Can fix firewall issues from browser

2. **Lightsail Console:**
   - Browser-based SSH access
   - Managed through AWS console
   - Bypasses local network issues

3. **Document Emergency Procedures:**
   - Step-by-step guide to fix firewall issues
   - Keep firewall rule documentation
   - Know how to re-apply rules quickly

## Detection & Response Plan

### Early Detection

1. **Automated Monitoring:**
   - Run `monitor-lightsail-connectivity.ps1` continuously
   - Checks every 5 minutes
   - Alerts after 3 failures (15 minutes)

2. **Health Check Endpoints:**
   - WordPress API health check endpoint
   - Next.js application health check
   - Monitor these endpoints

3. **User Reports:**
   - Monitor error rates on live site
   - Watch for 500/501 errors
   - Track API timeout rates

### Response Procedure

When connectivity issues detected:

1. **Immediate (0-5 minutes):**
   - Run diagnostic: `scripts/test-ssh-connection.ps1`
   - Verify firewall rules in Lightsail console
   - Check instance status

2. **Quick Fix (5-15 minutes):**
   - Re-apply firewall rules
   - Restart instance if needed
   - Verify connectivity restored

3. **If Quick Fix Fails (15+ minutes):**
   - Use AWS Systems Manager to access instance
   - Check instance logs
   - Review firewall rule history
   - Contact AWS support if needed

### Recovery Checklist

- [ ] Run connectivity diagnostic script
- [ ] Verify firewall rules in Lightsail console
- [ ] Re-apply firewall rules (remove and re-add)
- [ ] Restart instance if needed
- [ ] Verify SSH access restored
- [ ] Verify API endpoints working
- [ ] Test from production environment
- [ ] Monitor for 30 minutes to ensure stability
- [ ] Document what happened and why

## Monitoring Setup

### Option 1: Local Monitoring (Development)

Run monitoring script on local machine:

```powershell
# Start monitoring (runs continuously)
powershell -ExecutionPolicy Bypass -File scripts/monitor-lightsail-connectivity.ps1
```

### Option 2: Scheduled Task (Windows)

Set up Windows Task Scheduler to run periodic checks:

1. Create scheduled task
2. Run `test-ssh-connection.ps1` every hour
3. Log results
4. Alert on failures

### Option 3: CloudWatch Alarms (Recommended for Production)

Set up AWS CloudWatch alarms:

1. **Create Custom Metric:**
   - Health check endpoint reports connectivity status
   - CloudWatch receives metric data

2. **Create Alarms:**
   - Alarm when connectivity fails
   - Alarm when API errors spike
   - Alarm when instance metrics show issues

3. **SNS Notifications:**
   - Email alerts on alarm
   - SMS alerts for critical issues

### Option 4: Third-Party Monitoring

Use external monitoring service:
- UptimeRobot
- Pingdom
- StatusCake

Monitor endpoints:
- https://api.cowboykimono.com/wp-json/
- https://cowboykimono.com

## Best Practices Summary

1. ✅ **Use Static IP** - More stable than auto-assigned
2. ✅ **Monitor Continuously** - Detect issues early
3. ✅ **Document Everything** - Know your firewall rules
4. ✅ **Verify After Changes** - Don't assume rules work
5. ✅ **Have Backup Access** - AWS Systems Manager ready
6. ✅ **Regular Maintenance** - Monthly restarts recommended
7. ✅ **Automate Checks** - Don't rely on manual verification
8. ✅ **Plan for Recovery** - Know the fix procedure

## Related Files

- `scripts/monitor-lightsail-connectivity.ps1` - Continuous monitoring script
- `scripts/test-ssh-connection.ps1` - Connectivity diagnostic script
- `scripts/diagnose-api-errors.js` - API endpoint diagnostic
- `DOCUMENTATION.md` - Complete troubleshooting guide

## Future Improvements

1. **Automated Firewall Fix:**
   - Script that auto-reapplies firewall rules when blocked
   - AWS Lambda function to check and fix

2. **CloudWatch Dashboard:**
   - Custom dashboard showing connectivity metrics
   - Visual alerts and trends

3. **Infrastructure as Code:**
   - Define firewall rules in CDK/CloudFormation
   - Version control for firewall configuration

4. **Health Check API:**
   - Endpoint that reports connectivity status
   - Used by monitoring tools

---

**Last Updated:** 2025-01-25  
**Status:** Prevention strategies implemented, monitoring tools available


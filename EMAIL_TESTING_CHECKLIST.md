# Email System Testing Checklist

## Pre-Test Setup (CRITICAL)

### 1. Verify SendGrid API Key
- Open backend → Edge Functions → Manage Secrets
- Confirm `SENDGRID_API_KEY` exists
- If missing: Get key from https://app.sendgrid.com/settings/api_keys

### 2. Verify Sender Email in SendGrid
⚠️ **MOST COMMON FAILURE REASON**
- Go to: https://app.sendgrid.com/settings/sender_auth/senders
- Verify your sender email address
- If using `noreply@yourdomain.com`, verify `yourdomain.com`
- SendGrid will NOT send emails from unverified addresses

### 3. Set Company Information
- Go to: Dashboard → Settings → Company Settings
- Fill in:
  - ✅ Business Name
  - ✅ Email Address (must match verified SendGrid email)
  - ✅ Phone Number
  - ✅ Physical Address

## Test #1: Direct Edge Function Test

Open browser console on your site and run:

```javascript
const testEmail = async () => {
  const response = await fetch('/functions/v1/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'YOUR_REAL_EMAIL@example.com',
      subject: 'Test Email from CRM',
      html: '<h1>Hello!</h1><p>This is a test.</p>',
      from: 'YOUR_VERIFIED_SENDGRID_EMAIL@example.com'
    })
  });
  
  const result = await response.json();
  console.log('Result:', result);
  return result;
};

await testEmail();
```

**Expected Output:**
```json
{ "success": true }
```

**If you see error:**
- 401: Invalid API key
- 403: Email not verified in SendGrid
- Check edge function logs for details

## Test #2: Lead Form Email (PRIMARY TEST)

1. **Navigate to contact form** (e.g., `/contact`)

2. **Fill out with YOUR real email:**
   - First Name: Test
   - Last Name: Customer
   - Email: YOUR_REAL_EMAIL@example.com
   - Phone: 555-0100
   - Service: Any
   - Message: "Test lead submission"

3. **Submit and immediately check:**
   - Browser console for success message
   - Edge function logs (Backend → Edge Functions → send-email → Logs)

4. **Within 60 seconds, check your email:**
   - Check inbox AND spam folder
   - Subject: "Thank you for contacting us - [Your Company]"

5. **Verify email content:**
   - ✅ Professional HTML design (blue header)
   - ✅ Your name appears: "Dear Test Customer"
   - ✅ Service name appears
   - ✅ Your message appears in info box
   - ✅ Company info in footer
   - ✅ NO {{variable}} placeholders visible
   - ✅ Looks good on mobile

## Test #3: Email Queue Verification

1. **Navigate to:** Dashboard → Email Queue

2. **Find your test email** (should be at top)

3. **Verify it shows:**
   - Template: lead-submission-confirmation
   - To: YOUR_EMAIL
   - Status: **"sent"** (green badge)
   - Sent timestamp (recent)
   - Subject with NO {{variables}}

4. **Click "View Details"**
   - Should show full HTML email
   - All variables replaced
   - No error message

## Test #4: Check Email Templates

1. **Navigate to:** Settings → Email Templates

2. **Verify 5 templates exist:**
   - lead-submission-confirmation
   - quote-created
   - invoice-created
   - appointment-scheduled
   - project-update

3. **Click to view one:**
   - Should have professional HTML
   - Should have blue/green/red/purple/orange styling
   - Variables listed on right side

## Troubleshooting

### Email shows "failed" status

**Check edge function logs:**
- Backend → Edge Functions → send-email → Logs
- Look for error message

**Common errors:**
- `401 Unauthorized` → Invalid SendGrid API key
- `403 Forbidden` → Sender email not verified
- `400 Bad Request` → Invalid email format

**Fix:**
1. Verify SendGrid API key is correct
2. Verify sender email at https://app.sendgrid.com/settings/sender_auth/senders
3. Make sure Company Settings email matches verified SendGrid email

### No email received but status is "sent"

**Possible causes:**
- Email in spam folder (check there first!)
- SendGrid has daily send limits (check SendGrid dashboard)
- Recipient email has typo

**Fix:**
1. Check spam/junk folder thoroughly
2. Check SendGrid activity: https://app.sendgrid.com/email_activity
3. Look for your test email in SendGrid logs

### Variables not replaced (still see {{customer_name}})

**This should be fixed now** after the recent migration.

If still happening:
1. Refresh the page to clear cache
2. Check that template exists in Email Templates page
3. Verify template name is exactly `lead-submission-confirmation`

### "Template not found" error

**Fix:**
1. Migration was just executed - refresh browser
2. Go to Settings → Email Templates to verify templates exist
3. Check edge function logs for actual error message

## Success Criteria

✅ Direct edge function test returns `{"success": true}`
✅ Test email received in inbox within 60 seconds
✅ Lead form sends confirmation email
✅ Email has professional HTML design
✅ All {{variables}} replaced with actual data
✅ Email Queue shows status "sent" (green)
✅ Edge function logs show "✅ Email sent successfully"
✅ No error messages anywhere

## Report Template

When reporting results, include:

**1. Direct Test Result:**
- Console output: [paste here]
- Email received: YES/NO
- Time to receive: [X seconds]

**2. Lead Form Test:**
- Email received: YES/NO
- Professional design: YES/NO
- Variables replaced: YES/NO
- Screenshot of email: [attach]

**3. Email Queue:**
- Status shown: [sent/failed/pending]
- Screenshot: [attach]

**4. Edge Function Logs:**
- Any errors: [paste here]
- Success messages: [paste here]
- Screenshot: [attach]

**5. Screenshots to provide:**
- Received email (if any)
- Email Queue entry
- Edge function logs
- Console errors (if any)

## Next Steps After Success

Once emails are working:

1. **Update sender email** to match your actual domain
2. **Customize email templates** with your branding
3. **Test other triggers** (quotes, invoices, appointments)
4. **Set up email domain** in SendGrid for better deliverability
5. **Monitor Email Queue** for any failed sends

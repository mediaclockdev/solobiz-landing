# EmailJS Setup Guide for SoloBizCards

This guide will help you set up EmailJS to receive welcome form submissions at your email address `robuc33@gmail.com`.

## 🚀 Quick Setup (5-10 minutes)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Add Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose "Gmail" 
4. Enter your Gmail credentials:
   - **Email**: `robuc33@gmail.com`
   - **Password**: Use an App Password (see Step 3)
5. Click "Create Service"
6. **Copy the Service ID** (e.g., `service_abc123`)

### Step 3: Create Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security" → "2-Step Verification" (enable if not already)
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)
6. Use this password in EmailJS, NOT your regular Gmail password

### Step 4: Create Email Template
1. In EmailJS dashboard, go to "Email Templates"
2. Click "Create New Template"
3. **Template Name**: `New User Registration`
4. **Template Content**:

```html
Subject: 🎉 New User Registration - SoloBizCards

<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .section { margin-bottom: 25px; padding: 15px; border-left: 4px solid #667eea; background: #f8f9fa; }
        .label { font-weight: bold; color: #667eea; }
        .value { margin-left: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 New User Registration</h1>
        <p>SoloBizCards - Digital Business Card Platform</p>
    </div>
    
    <div class="content">
        <div class="section">
            <h3>👤 User Information</h3>
            <p><span class="label">Name:</span><span class="value">{{user_name}}</span></p>
            <p><span class="label">Email:</span><span class="value">{{user_email}}</span></p>
            <p><span class="label">Registration Date:</span><span class="value">{{registration_date}}</span></p>
            <p><span class="label">Referral Source:</span><span class="value">{{referral_source}}</span></p>
        </div>

        <div class="section">
            <h3>💼 Business Card Details</h3>
            <p><span class="label">Company:</span><span class="value">{{company}}</span></p>
            <p><span class="label">Job Title:</span><span class="value">{{job_title}}</span></p>
            <p><span class="label">Business Phone:</span><span class="value">{{business_phone}}</span></p>
            <p><span class="label">Business Email:</span><span class="value">{{business_email}}</span></p>
            <p><span class="label">Website:</span><span class="value">{{website}}</span></p>
            <p><span class="label">Address:</span><span class="value">{{address}}</span></p>
        </div>

        <div class="section">
            <h3>🎨 Card Configuration</h3>
            <p><span class="label">Template:</span><span class="value">{{card_template}}</span></p>
            <p><span class="label">Layout:</span><span class="value">{{card_layout}}</span></p>
            <p><span class="label">Card Created:</span><span class="value">{{card_created}}</span></p>
        </div>
    </div>
</body>
</html>
```

5. **To Email**: `{{to_email}}` (this will be `robuc33@gmail.com`)
6. **From Name**: `SoloBizCards Registration`
7. **Reply To**: `{{user_email}}`
8. Click "Save"
9. **Copy the Template ID** (e.g., `template_xyz789`)

### Step 5: Get Public Key
1. In EmailJS dashboard, go to "Account" → "General"
2. Find "Public Key" section
3. **Copy your Public Key** (e.g., `user_abc123def456`)

### Step 6: Update Environment Variables
1. Open `.env.local` in your project
2. Replace the placeholder values:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=user_abc123def456
```

### Step 7: Test the Integration
1. Restart your development server: `npm run dev`
2. Create a new business card
3. Fill out the welcome form
4. Check your email at `robuc33@gmail.com`

## 📧 What You'll Receive

Every time someone completes the welcome form, you'll get a professional email with:

- **User Details**: Name, email, registration date, referral source
- **Business Card Info**: Company, title, contact details, address
- **Technical Data**: Card template, layout, creation date
- **Professional Formatting**: Clean HTML email with your branding

## 🔧 Troubleshooting

### Email Not Sending?
1. **Check Console**: Look for errors in browser developer tools
2. **Verify Credentials**: Ensure Service ID, Template ID, and Public Key are correct
3. **Gmail App Password**: Make sure you're using the 16-character app password, not your regular password
4. **Template Variables**: Ensure all `{{variable_name}}` placeholders match the code

### Gmail Issues?
1. **2-Factor Authentication**: Must be enabled for app passwords
2. **Less Secure Apps**: Should be disabled (use app passwords instead)
3. **Account Verification**: Ensure your Gmail account is verified

### Rate Limits?
- **Free Tier**: 200 emails/month
- **Paid Plans**: Available if you need more

## 🎯 Free Tier Limits

EmailJS free tier includes:
- ✅ 200 emails per month
- ✅ Unlimited templates
- ✅ All features included
- ✅ No setup fees

Perfect for getting started! You can upgrade later if needed.

## 🚀 Next Steps

Once EmailJS is configured:
1. Test with a few registrations
2. Monitor your email for new user notifications
3. Consider upgrading to paid plan if you exceed 200 emails/month
4. Optionally add more email templates for different notifications

## 📞 Support

If you need help:
- **EmailJS Docs**: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- **Gmail App Passwords**: [https://support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)

---

**Total Setup Time**: ~8 minutes
**Cost**: Free (200 emails/month)
**Maintenance**: None required

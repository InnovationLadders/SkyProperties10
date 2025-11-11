# Google Maps API Setup Guide

This guide will help you set up a Google Maps API key for the SkyProperties application.

## Overview

The application uses Google Maps for property location visualization and coordinate selection. The following Google Maps APIs are required:

- **Maps JavaScript API** - For displaying interactive maps
- **Geocoding API** - For converting addresses to coordinates
- **Places API** - For location search and autocomplete features

## Prerequisites

- A Google account
- A credit card (required for Google Cloud Platform, though there's a generous free tier)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click **"New Project"**
5. Enter a project name (e.g., "SkyProperties")
6. Click **"Create"**

### 2. Enable Billing

1. In the Google Cloud Console, go to **Billing**
2. Link a billing account to your project
3. Note: Google Maps has a generous free tier ($200 free credit per month)

### 3. Enable Required APIs

1. Go to **APIs & Services > Library**
2. Search for and enable each of the following APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**
3. Click **"Enable"** for each API

### 4. Create an API Key

1. Go to **APIs & Services > Credentials**
2. Click **"Create Credentials"** at the top
3. Select **"API Key"**
4. Your new API key will be displayed
5. Copy the API key immediately

### 5. Secure Your API Key (Recommended)

#### For Development:

1. Click on your newly created API key to edit it
2. Under **"Application restrictions"**, select **"None"** for local development
3. Under **"API restrictions"**, select **"Restrict key"**
4. Select only the APIs you enabled earlier:
   - Maps JavaScript API
   - Geocoding API
   - Places API
5. Click **"Save"**

#### For Production:

1. Edit your API key in the Google Cloud Console
2. Under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
3. Add your production domain:
   - `https://yourdomain.com/*`
   - `https://www.yourdomain.com/*`
4. Under **"API restrictions"**, keep the same API restrictions as above
5. Click **"Save"**

**Security Best Practice**: Create separate API keys for development and production environments.

### 6. Configure Your Application

1. Open the `.env` file in the root of your project
2. Replace the placeholder API key with your actual key:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

3. Save the file
4. Restart your development server

### 7. Set Up Billing Alerts (Recommended)

1. Go to **Billing > Budgets & alerts**
2. Click **"Create Budget"**
3. Set a monthly budget (e.g., $50)
4. Configure alerts at 50%, 90%, and 100% of budget
5. This helps prevent unexpected charges

## Pricing Information

Google Maps Platform has a pay-as-you-go pricing model with a monthly free credit:

- **$200 free credit per month** (covers approximately 28,000 map loads)
- After free credit is exhausted, you'll be charged per 1,000 requests:
  - Maps JavaScript API: $7 per 1,000 loads
  - Geocoding API: $5 per 1,000 requests
  - Places API: Varies by request type

For most small to medium applications, the free tier is sufficient.

## Troubleshooting

### Error: "AuthFailure - API key is invalid"

**Solutions:**
1. Verify the API key is copied correctly in the `.env` file
2. Ensure there are no extra spaces or quotes around the key
3. Check that the Maps JavaScript API is enabled in Google Cloud Console
4. Wait a few minutes after creating the key (propagation delay)

### Error: "This API key is not authorized to use this service or API"

**Solutions:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your API key
3. Under "API restrictions", ensure Maps JavaScript API is selected
4. Remove any HTTP referrer restrictions for local development

### Map loads but shows "For development purposes only" watermark

**Solutions:**
1. Ensure billing is enabled on your Google Cloud project
2. The watermark appears when there's no valid billing account

### Error: "RefererNotAllowedMapError"

**Solutions:**
1. Edit your API key in Google Cloud Console
2. Under "Application restrictions", either:
   - Select "None" for development
   - Add your domain to HTTP referrers for production
3. Save and wait a few minutes for changes to propagate

## Testing Your Setup

After configuring your API key:

1. Start the development server: `npm run dev`
2. Navigate to the Properties page
3. You should see an interactive map with property markers
4. Try creating or editing a property to test the coordinate picker

## Security Reminders

- Never commit your `.env` file to version control
- Use different API keys for development and production
- Set up HTTP referrer restrictions for production keys
- Monitor your usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- Regenerate your API key immediately if it's exposed

## Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Google Maps Pricing](https://mapsplatform.google.com/pricing/)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you continue to experience issues after following this guide:

1. Check the browser console for detailed error messages
2. Verify all APIs are enabled in Google Cloud Console
3. Ensure billing is set up correctly
4. Try creating a new API key
5. Wait 5-10 minutes for changes to propagate

For application-specific issues, please refer to the main project documentation.

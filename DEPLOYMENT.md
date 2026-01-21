# Deployment Guide

## Overview

This guide explains how to deploy only the main Skincare Consultant application without uploading the development tools (data-upload and product-coverage-analysis).

---

## What Gets Deployed

### ✅ Included in Deployment (Main App)

- `src/` - Application source code
- `public/` - Public assets
- Root configuration files (required by Next.js):
  - `package.json` & `package-lock.json`
  - `next.config.mjs`
  - `tailwindcss.config.js`
  - `postcss.config.cjs`
  - `eslint.config.mjs`
  - `jsconfig.json`
- `README.md` - Project documentation

### ❌ Excluded from Deployment (Development Tools)

- `data-upload/` - Python data upload tool (run locally)
- `product-coverage-analysis/` - Testing/analysis tool (run locally)
- `docs/` - Documentation files (not needed in production)
- Development files (CSV, Excel, reports, etc.)

---

## Deployment Options

### Option 1: Using Deployment Ignore Files (Recommended)

Platform-specific ignore files are already created:

- **Vercel**: `.vercelignore` (already created)
- **Netlify**: `.netlifyignore` (already created)

These files automatically exclude the tools during deployment.

#### For Vercel:
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Vercel will automatically use `.vercelignore`
4. Only main app files will be deployed

#### For Netlify:
1. Push code to repository
2. Connect to Netlify
3. Netlify will use `.netlifyignore`
4. Only main app files will be deployed

#### For Other Platforms:
Create platform-specific ignore file:
- **Railway**: Create `.railwayignore`
- **Render**: Files are automatically ignored based on build context
- **Docker**: Use `.dockerignore`

---

### Option 2: Manual Deployment Configuration

Most hosting platforms allow you to specify:
- **Build command**: `npm run build`
- **Output directory**: `.next` (Next.js default)
- **Root directory**: `.` (root of repo)

The tools folders won't affect the build since Next.js only processes `src/` and `public/`.

---

### Option 3: Separate Repository (Future)

If you want complete separation, you could:

1. **Keep current repo for development** (includes all tools)
2. **Create separate deployment repo** with only:
   - `src/`
   - `public/`
   - Config files
   - `package.json`

**Note**: This requires maintaining two repos. Not recommended unless you have specific requirements.

---

## Deployment Checklist

### Before Deploying:

1. ✅ **Environment Variables** - Set in hosting platform:
   - `MONGODB_URI` - MongoDB connection string
   - `NEXT_PUBLIC_APP_URL` - Production URL
   - `NEXT_PUBLIC_SHOPIFY_STORE_URL` - Shopify store URL
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Shopify token (if using)
   - `SHOPIFY_ADMIN_API_KEY` - Shopify admin API key (if using)
   - `SHOPIFY_ADMIN_API_SECRET` - Shopify admin API secret (if using)

2. ✅ **Node.js Version** - Ensure platform supports Node.js 18.17+

3. ✅ **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next` (or use Next.js default)
   - Install Command: `npm install`

4. ✅ **Database** - Ensure MongoDB Atlas:
   - Has your production database
   - IP whitelist includes hosting platform IPs (or 0.0.0.0/0 for Vercel/Netlify)

---

## Platform-Specific Instructions

### Vercel (Recommended for Next.js)

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Or connect GitHub repo in Vercel dashboard

3. **Environment Variables**:
   - Set in Vercel dashboard: Settings → Environment Variables

4. **`.vercelignore` is automatically used** ✅

### Netlify

1. **Connect Repository** in Netlify dashboard

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next` (or leave default)

3. **Environment Variables**:
   - Set in Netlify dashboard: Site settings → Environment variables

4. **`.netlifyignore` is automatically used** ✅

### Railway

1. **Create `.railwayignore`** (similar to `.vercelignore`)

2. **Connect Repository**

3. **Set Environment Variables**

4. **Build will automatically use Next.js**

### Render

1. **Create Web Service**

2. **Connect Repository**

3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`

5. **Environment Variables**: Set in dashboard

---

## File Size Optimization

The ignore files help reduce deployment size:

- **Without ignore files**: ~50-100 MB (includes tools, data files, docs)
- **With ignore files**: ~20-30 MB (only main app)

This results in:
- ✅ Faster deployments
- ✅ Cleaner production environment
- ✅ Reduced confusion about what's running

---

## Development vs Production

### Development (Local)
- Run `npm run dev` for main app
- Run `python data-upload/scripts/upload_kbeauty_data.py` for data upload
- Run `npm run analyze-coverage` for coverage analysis
- All tools available locally

### Production (Deployed)
- Only main Next.js app is deployed
- Tools remain in repository (for future use)
- Tools are excluded from deployment via ignore files

---

## Troubleshooting

### Issue: Tools folders still being uploaded

**Solution**: 
- Verify `.vercelignore` or `.netlifyignore` exists
- Check that ignore file is committed to repository
- Some platforms may cache - trigger new deployment

### Issue: Build fails because of missing files

**Solution**:
- Ensure you're not importing from `data-upload/` or `product-coverage-analysis/` in `src/`
- These folders should only be used locally, not imported by the main app

### Issue: Environment variables not working

**Solution**:
- Verify variables are set in hosting platform dashboard
- Check variable names match exactly (case-sensitive)
- For `NEXT_PUBLIC_*` variables, ensure they're set correctly
- Redeploy after setting variables

---

## Summary

✅ **Use `.vercelignore` or `.netlifyignore`** to exclude tools  
✅ **Only main app (`src/`, `public/`, configs) gets deployed**  
✅ **Tools stay in repo for local development**  
✅ **No need for separate repositories**  

The current setup is deployment-ready! Just use the appropriate ignore file for your hosting platform.

---

**Last Updated**: December 2025


﻿# MORPHEUS ECHO - DEPLOYMENT GUIDE

## Environment Variables Template

Copy these values to your Render dashboard:

\\\env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Admin Configuration
ADMIN_PASSWORD=79827

# AI Content Moderation APIs (Optional)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Redis Configuration (Optional - For Upstash)
REDIS_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
\\\

## Important Security Notes

- Never commit real credentials to GitHub
- Use environment variables for all secrets
- Rotate keys if exposed

## PWA Updates

The Service Worker cache version is now completely automated during the build process. 
Every time you deploy (or run `npm run build`), a unique timestamp is injected into `sw.js` to ensure users always receive the latest app updates without any manual intervention!

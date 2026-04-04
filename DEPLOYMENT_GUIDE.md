# MORPHEUS ECHO - DEPLOYMENT GUIDE

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
\\\

## Important Security Notes

- Never commit real credentials to GitHub
- Use environment variables for all secrets
- Rotate keys if exposed

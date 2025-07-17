# Deploy Just HIIT to Render

This guide explains how to deploy the Just HIIT timer app to Render.

## Deployment Steps

### Option 1: Using Render Dashboard (Recommended)

1. **Connect your repository**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository containing this project

2. **Configure the service**:
   - **Name**: `just-hiit` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or higher for better performance)

3. **Environment Variables** (Optional):
   - `NODE_ENV`: `production` (automatically set)
   - No additional environment variables needed for basic functionality

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - The build process typically takes 5-10 minutes

### Option 2: Using render.yaml (Infrastructure as Code)

1. **Fork/Clone this repository** to your GitHub account

2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Review and Deploy**:
   - Review the configuration
   - Click "Apply" to deploy

## What Gets Deployed

- **Frontend**: React PWA with offline capabilities
- **Backend**: Express.js server serving the frontend and handling any future API needs
- **Features**: Full HIIT timer functionality, audio cues, settings persistence

## Post-Deployment

After successful deployment:

1. **Test the app**: Visit your Render URL (something like `https://just-hiit.onrender.com`)
2. **Verify functionality**:
   - Timer controls work
   - Audio beeps and voice work (you may need to interact with the page first)
   - Settings save and load correctly
   - App works offline after first visit

## Troubleshooting

### Build Fails
- Check that all dependencies are properly listed in `package.json`
- Verify Node.js version compatibility (app uses Node 18+)

### App Doesn't Load
- Check the Render logs for errors
- Ensure the build completed successfully
- Verify the start command is working

### Audio Not Working
- This is normal on first visit - browsers require user interaction before allowing audio
- Click "Test Beep" or "Test Voice" to initialize audio
- Audio should work normally after initialization

## Technical Details

- **Port**: Automatically configured for Render's environment
- **Static Files**: Served directly by Express in production
- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Health Check**: Available at the root path (`/`)

## Performance

- **Free Tier**: App will sleep after 15 minutes of inactivity
- **Paid Tiers**: Always-on service with better performance
- **CDN**: Static assets automatically served via Render's CDN

The app is optimized for mobile use and works as a Progressive Web App (PWA).
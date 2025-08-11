# Step-by-Step Deployment to Vercel

## 1. Login to Vercel

```bash
vercel login
```

## 2. Deploy the Application

```bash
vercel --prod
```

## 3. Set Environment Variables

After deployment, go to your Vercel dashboard and add:

**Environment Variable:**
- Name: `MONGODB_URI`
- Value: `mongodb+srv://iasr6629:9EcGZI4a2tQMJ2B1@cluster0.of1y8nm.mongodb.net/cardekho`

## 4. Test the API

After deployment, test with:

```bash
curl -X POST https://carwalle.vercel.app/api/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090, "address": "Test Location"}'
```

## 5. Common Issues & Fixes

### If deployment fails:

1. **Login Issue**: Run `vercel login` first
2. **Build Error**: Make sure all dependencies are in package.json
3. **API Error**: Check that `/api/location.js` uses `export default`
4. **Environment Variables**: Set `MONGODB_URI` in Vercel dashboard

### Expected File Structure:
```
location-app/
├── api/
│   └── location.js      (Vercel API function)
├── src/
│   └── App.js           (React frontend)
├── package.json
├── vercel.json
└── .env                 (local only)
```

## 6. Verify Deployment

Once deployed:
1. ✅ Visit `https://carwalle.vercel.app` 
2. ✅ Click the download button
3. ✅ Check MongoDB for new location data

## Current Status:
- ✅ Local API working at `http://localhost:3000/api/location`
- ✅ MongoDB connected to `cardekho` database  
- ✅ Data being saved successfully (tested locally)
- ⏳ Production deployment needed
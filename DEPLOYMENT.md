# Deployment to Vercel

## Setup Instructions

### 1. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy the app
vercel --prod
```

### 2. Set Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard and add these environment variables:

- `MONGODB_URI`: `mongodb+srv://iasr6629:9EcGZI4a2tQMJ2B1@cluster0.of1y8nm.mongodb.net/cardekho`

### 3. Domain Configuration

Your app will be available at: `https://carwalle.vercel.app`

### 4. API Endpoints

Once deployed, the following endpoints will be available:

- `POST https://carwalle.vercel.app/api/location` - Save location data
- `GET https://carwalle.vercel.app/api/location` - Get all locations

### 5. MongoDB Integration

Data will be automatically saved to your MongoDB Atlas database:
- **Database**: `cardekho`
- **Collection**: `locations`
- **Fields**: latitude, longitude, address, IP, userAgent, deviceInfo, timestamps

### 6. Testing

To test the production API:

```bash
curl -X POST https://carwalle.vercel.app/api/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090, "address": "Test Location"}'
```

## Local Development

```bash
# Run both frontend and backend locally
npm run dev

# Local API: http://localhost:3000/api/location
# Frontend: http://localhost:3000
```
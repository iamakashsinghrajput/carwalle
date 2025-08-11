const mongoose = require('mongoose');

// MongoDB connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Location Schema
const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    default: ''
  },
  deviceInfo: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader(corsHeaders).end();
  }

  // Set CORS headers for all requests
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  try {
    await dbConnect();

    if (req.method === 'POST') {
      console.log('Received location data from carwalle.vercel.app:', req.body);
      
      const locationData = new Location({
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        address: req.body.address || '',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.body.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || req.body.userAgent || '',
        sessionId: req.body.sessionId || '',
        deviceInfo: req.body.deviceInfo || {}
      });

      console.log('Saving location data to MongoDB Atlas...');
      const savedLocation = await locationData.save();
      console.log('Location data saved successfully:', savedLocation._id);
      
      return res.status(201).json({
        success: true,
        message: 'Location data saved successfully from carwalle.vercel.app',
        data: savedLocation,
        collection: 'locations'
      });
    }

    if (req.method === 'GET') {
      const locations = await Location.find().sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: locations.length,
        data: locations
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in Vercel API function:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}
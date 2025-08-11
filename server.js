const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('MongoDB Connected Successfully');
  console.log('Database name:', mongoose.connection.name);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Location Data Schema
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

const Location = mongoose.model('Location', locationSchema);

// API Routes
app.post('/api/location', async (req, res) => {
  try {
    console.log('Received location data:', req.body);
    
    const locationData = new Location({
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      address: req.body.address || '',
      ip: req.body.ip || 'Unknown',
      userAgent: req.body.userAgent || '',
      sessionId: req.body.sessionId || '',
      deviceInfo: req.body.deviceInfo || {}
    });

    console.log('Saving location data to MongoDB...');
    const savedLocation = await locationData.save();
    console.log('Location data saved successfully:', savedLocation._id);
    
    res.status(201).json({
      success: true,
      message: 'Location data saved successfully to cardekho database',
      data: savedLocation,
      collection: 'locations'
    });
  } catch (error) {
    console.error('Error saving location to MongoDB:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving location data',
      error: error.message
    });
  }
});

// Get all locations (for admin purposes)
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location data',
      error: error.message
    });
  }
});

// Get location by ID
app.get('/api/location/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location data',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get database stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      message: 'Server and database are running',
      database: {
        name: mongoose.connection.name,
        state: dbStates[dbState],
        collections: collections.map(c => c.name)
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message,
      timestamp: new Date()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
});
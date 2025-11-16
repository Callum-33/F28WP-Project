require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use('/uploads', express.static('/app/uploads')); // Serve uploaded images

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Backend running!', status: 'healthy' });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Public routes (no authentication required)
app.use('/api', authRoutes);
app.use('/api', listingRoutes);
app.use('/api/bookings', bookingRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
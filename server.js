const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend running!');
});

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');

app.use('/api', authRoutes);
app.use('/api', listingRoutes);
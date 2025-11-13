
const router = require('express').Router();
const pool = require('../utils/dbConnection');

// Create listing
router.post('/listings', async (req, res) => {
    const { listerId, title, description, price, location } = req.body;

    if (!title || !price || !listerId) {
        return res.status(400).json({ error: 'Missing required fields: title, price, listerId' });
    }

    try {
        // Convert location object to address string if needed
        let address = '';
        if (location && typeof location === 'object') {
            address = [location.street, location.city, location.country]
                .filter(Boolean)
                .join(', ');
        } else if (typeof location === 'string') {
            address = location;
        }

        const query = `
            INSERT INTO Properties (ownerID, propertyName, pDescription, pAddress, pricePerNight, rooms)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING propertyID, ownerID, propertyName, pDescription, pAddress, pricePerNight, rooms
        `;
        
        const values = [
            listerId,
            title,
            description || '',
            address,
            parseFloat(price),
            1 // Default to 1 room, you may want to make this a required field
        ];

        const result = await pool.query(query, values);
        const newListing = result.rows[0];

        // Transform the response to match the expected format
        const responseData = {
            id: newListing.propertyid,
            listerId: newListing.ownerid,
            title: newListing.propertyname,
            description: newListing.pdescription,
            price: parseFloat(newListing.pricepernight),
            location: { address: newListing.paddress },
            rooms: newListing.rooms,
            dateListed: new Date().toISOString()
        };

        res.status(201).json({
            message: 'Listing posted successfully.',
            listing: responseData
        });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ error: 'Internal server error while creating listing' });
    }
});

// Get and filter listings
router.get('/listings', async (req, res) => {
    try {
        let query = `
            SELECT p.propertyID as id, p.ownerID as listerId, p.propertyName as title, 
                   p.pDescription as description, p.pAddress as address, 
                   p.pricePerNight as price, p.rooms,
                   u.fName as ownerFirstName, u.lName as ownerLastName
            FROM Properties p
            LEFT JOIN Users u ON p.ownerID = u.userID
        `;
        let values = [];
        let whereConditions = [];

        const { location, maxPrice } = req.query;

        if (location) {
            whereConditions.push(`(LOWER(p.pAddress) LIKE $${whereConditions.length + 1} OR LOWER(p.propertyName) LIKE $${whereConditions.length + 1})`);
            values.push(`%${location.toLowerCase()}%`);
        }

        if (maxPrice) {
            const priceLimit = parseFloat(maxPrice);
            if (!isNaN(priceLimit)) {
                whereConditions.push(`p.pricePerNight <= $${whereConditions.length + 1}`);
                values.push(priceLimit);
            }
        }

        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        const result = await pool.query(query, values);
        
        // Transform the results to match the expected format
        const listings = result.rows.map(row => ({
            id: row.id,
            listerId: row.listerid,
            title: row.title,
            description: row.description,
            price: parseFloat(row.price),
            location: { address: row.address },
            rooms: row.rooms,
            owner: row.ownerfirstname ? `${row.ownerfirstname} ${row.ownerlastname}` : null
        }));

        res.status(200).json(listings);
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Internal server error while fetching listings' });
    }
});

// Update listing
router.put('/listings/:id', (req, res) => {
    const listingId = parseInt(req.params.id);
    const updateData = req.body;
    const listings = readData('listings.json');

    const listingIndex = listings.findIndex(l => l.id === listingId);

    if (listingIndex === -1) {
        return res.status(404).json({ error: 'Listing not found' });
    }

    const currentListing = listings[listingIndex];
    listings[listingIndex] = {
        ...currentListing,
        ...updateData,
        id: listingId,
    };

    writeData('listings.json', listings);
    res.status(200).json({
        message: 'Listing updated successfully.',
        listing: listings[listingIndex]
    });
});

// Delete listing
router.delete('/listings/:id', (req, res) => {
    const listingId = parseInt(req.params.id);
    const listings = readData('listings.json');

    const updatedListings = listings.filter(l => l.id !== listingId);

    if (updatedListings.length === listings.length) {
        return res.status(404).json({ error: 'Listing not found' });
    }

    writeData('listings.json', updatedListings);
    res.status(200).json({ message: 'Listing deleted successfully.' });
});

// Lister Routes
router.get('/listings/:id/bookings', (req, res) => {
    const listingId = parseInt(req.params.id);

    // load bookings
    const bookings = readData('bookings.json');

    if (bookings.length === 0) {
        return res.status(200).json([]);
    }
    res.status(200).json(listingBookings);
});

// Approve / deny booking
router.put('/listings/:id/status', (req, res) => {
    const bookingId = parseInt(req.params.id);
    const newStatus = req.body.status;

    if (!['approved', 'denied'].includes(newStatus)) {
        return res.status(400).json({message: 'Invalid status value. Must be "approved" or "denied".' });
    }

    const bookings = readData('bookings.json');
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
        return res.status(404).json({ message: 'Booking not found.' });
    }

    const bookingToUpdate = bookings[bookingIndex];

    if (bookingToUpdate.status === 'pending') {
        bookingToUpdate.status = newStatus;

        bookings[bookingIndex] = bookingToUpdate;
        writeData('bookings.json', bookings);

        res.status(200).json({
            message: 'Booking ${bookingId} ${newStatus}.',
            booking: bookingToUpdate
        });
    } else {
        return res.status(400).json({
            message: `Cannot change status. Booking is already ${bookingToUpdate.status}.`
        });
    }
});

// View lister's listings
router.get('/users/:listerId/listings', (req, res) => {
    const listerId = parseInt(req.params.listerId);

    const listings = readData('listings.json');

    const listersListing = listings.filter(l => l.listerId === listerId);

    res.status(200).json(listersListing);
});


module.exports = router;


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
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            listerId,
            title,
            description || '',
            address,
            parseFloat(price),
            1 // Default to 1 room, you may want to make this a required field
        ];

        const [result] = await pool.query(query, values);
        
        // Get the newly created listing
        const [newListingRows] = await pool.query(
            'SELECT propertyID, ownerID, propertyName, pDescription, pAddress, pricePerNight, rooms FROM Properties WHERE propertyID = ?',
            [result.insertId]
        );
        const newListing = newListingRows[0];

        // Transform the response to match the expected format
        const responseData = {
            id: newListing.propertyID,
            listerId: newListing.ownerID,
            title: newListing.propertyName,
            description: newListing.pDescription,
            price: parseFloat(newListing.pricePerNight),
            location: { address: newListing.pAddress },
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
            SELECT p.propertyID, p.ownerID, p.propertyName, 
                   p.pDescription, p.pAddress, 
                   p.pricePerNight, p.rooms, p.imagePath,
                   u.fName as ownerFirstName, u.lName as ownerLastName,
                   COALESCE(AVG(r.rating), 0) as rating
            FROM Properties p
            LEFT JOIN Users u ON p.ownerID = u.userID
            LEFT JOIN Reviews r ON p.propertyID = r.propertyID
        `;
        let values = [];
        let whereConditions = [];

        const { location, maxPrice } = req.query;

        if (location) {
            whereConditions.push('(LOWER(p.pAddress) LIKE ? OR LOWER(p.propertyName) LIKE ?)');
            const searchTerm = `%${location.toLowerCase()}%`;
            values.push(searchTerm, searchTerm);
        }

        if (maxPrice) {
            const priceLimit = parseFloat(maxPrice);
            if (!isNaN(priceLimit)) {
                whereConditions.push('p.pricePerNight <= ?');
                values.push(priceLimit);
            }
        }

        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        query += ' GROUP BY p.propertyID, p.ownerID, p.propertyName, p.pDescription, p.pAddress, p.pricePerNight, p.rooms, p.imagePath, u.fName, u.lName';

        const [result] = await pool.query(query, values);
        
        // Transform the results to match the expected format
        const listings = result.map(row => ({
            propertyID: row.propertyID,
            ownerID: row.ownerID,
            propertyName: row.propertyName,
            pDescription: row.pDescription,
            pAddress: row.pAddress,
            pricePerNight: parseFloat(row.pricePerNight),
            rooms: row.rooms,
            imagePath: row.imagePath,
            rating: parseFloat(row.rating) || 0,
            image: row.imagePath || 'https://via.placeholder.com/400x400?text=No+Image',
            owner: row.ownerFirstName ? `${row.ownerFirstName} ${row.ownerLastName}` : null
        }));

        res.status(200).json(listings);
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Internal server error while fetching listings' });
    }
});

// Update listing
router.put('/listings/:id', async (req, res) => {
    const listingId = parseInt(req.params.id);
    const updateData = req.body;

    try {
        // Check if listing exists
        const [existing] = await pool.query('SELECT propertyID FROM Properties WHERE propertyID = ?', [listingId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        let updateFields = [];
        let values = [];

        if (updateData.title !== undefined) {
            updateFields.push('propertyName = ?');
            values.push(updateData.title);
        }
        if (updateData.description !== undefined) {
            updateFields.push('pDescription = ?');
            values.push(updateData.description);
        }
        if (updateData.price !== undefined) {
            updateFields.push('pricePerNight = ?');
            values.push(parseFloat(updateData.price));
        }
        if (updateData.rooms !== undefined) {
            updateFields.push('rooms = ?');
            values.push(updateData.rooms);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(listingId);
        const updateQuery = `UPDATE Properties SET ${updateFields.join(', ')} WHERE propertyID = ?`;
        
        await pool.query(updateQuery, values);

        // Get the updated listing
        const [updatedRows] = await pool.query('SELECT * FROM Properties WHERE propertyID = ?', [listingId]);
        
        res.status(200).json({
            message: 'Listing updated successfully.',
            listing: updatedRows[0]
        });
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ error: 'Internal server error while updating listing' });
    }
});

// Delete listing
router.delete('/listings/:id', async (req, res) => {
    const listingId = parseInt(req.params.id);

    try {
        const [result] = await pool.query('DELETE FROM Properties WHERE propertyID = ?', [listingId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.status(200).json({ message: 'Listing deleted successfully.' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ error: 'Internal server error while deleting listing' });
    }
});

// Lister Routes - Get bookings for a property
router.get('/listings/:id/bookings', async (req, res) => {
    const listingId = parseInt(req.params.id);

    try {
        const [bookings] = await pool.query(
            'SELECT * FROM Bookings WHERE propertyID = ?',
            [listingId]
        );

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal server error while fetching bookings' });
    }
});

// Approve / deny booking
router.put('/listings/:id/status', async (req, res) => {
    const bookingId = parseInt(req.params.id);
    const newStatus = req.body.status;

    if (!['approved', 'denied'].includes(newStatus)) {
        return res.status(400).json({message: 'Invalid status value. Must be "approved" or "denied".' });
    }

    try {
        const [bookings] = await pool.query('SELECT * FROM Bookings WHERE bookingID = ?', [bookingId]);
        
        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const bookingToUpdate = bookings[0];

        if (bookingToUpdate.bookingStatus === 'Pending') {
            const capitalizedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            await pool.query(
                'UPDATE Bookings SET bookingStatus = ? WHERE bookingID = ?',
                [capitalizedStatus, bookingId]
            );

            const [updated] = await pool.query('SELECT * FROM Bookings WHERE bookingID = ?', [bookingId]);

            res.status(200).json({
                message: `Booking ${bookingId} ${newStatus}.`,
                booking: updated[0]
            });
        } else {
            return res.status(400).json({
                message: `Cannot change status. Booking is already ${bookingToUpdate.bookingStatus}.`
            });
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Internal server error while updating booking status' });
    }
});

// View lister's listings
router.get('/users/:listerId/listings', async (req, res) => {
    const listerId = parseInt(req.params.listerId);

    try {
        const [listings] = await pool.query(
            'SELECT * FROM Properties WHERE ownerID = ?',
            [listerId]
        );

        res.status(200).json(listings);
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ error: 'Internal server error while fetching user listings' });
    }
});


module.exports = router;

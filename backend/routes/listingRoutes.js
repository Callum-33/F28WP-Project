const router = require('express').Router();
const pool = require('../utils/dbConnection');
const { authenticateToken } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

// Simple image upload endpoint - stores base64 images as files
router.post('/listings/upload-image', authenticateToken, async (req, res) => {
    const { image, propertyID } = req.body;
    
    if (!image) {
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        // Extract base64 data and extension
        const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        const extension = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const filepath = path.join('/app/uploads/properties', filename);
        const relativePath = `/uploads/properties/${filename}`;

        // Write file
        fs.writeFileSync(filepath, buffer);

        // If propertyID provided, save to PropertyImages table
        if (propertyID) {
            const [existingImages] = await pool.query(
                'SELECT COUNT(*) as count FROM PropertyImages WHERE propertyID = ?',
                [propertyID]
            );
            const isPrimary = existingImages[0].count === 0;

            await pool.query(
                'INSERT INTO PropertyImages (propertyID, imagePath, isPrimary, displayOrder) VALUES (?, ?, ?, ?)',
                [propertyID, relativePath, isPrimary, existingImages[0].count]
            );
        }

        res.json({ imagePath: relativePath });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

router.post('/listings', authenticateToken, async (req, res) => {
    const { listerId, title, description, price, location, images } = req.body;

    if (!title || !price || !listerId) {
        return res.status(400).json({ error: 'Missing required fields: title, price, listerId' });
    }

    try {
        let address = '';
        if (location && typeof location === 'object') {
            address = [location.street, location.city, location.country].filter(Boolean).join(', ');
        } else if (typeof location === 'string') {
            address = location;
        }

        const [result] = await pool.query(
            'INSERT INTO Properties (ownerID, propertyName, pDescription, pAddress, pricePerNight, rooms) VALUES (?, ?, ?, ?, ?, ?)',
            [listerId, title, description || '', address, parseFloat(price), 1]
        );
        
        const propertyID = result.insertId;

        // Save images if provided
        if (images && Array.isArray(images) && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const imageData = images[i];
                const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const extension = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
                    const filepath = path.join('/app/uploads/properties', filename);
                    const relativePath = `/uploads/properties/${filename}`;
                    
                    fs.writeFileSync(filepath, buffer);
                    
                    await pool.query(
                        'INSERT INTO PropertyImages (propertyID, imagePath, isPrimary, displayOrder) VALUES (?, ?, ?, ?)',
                        [propertyID, relativePath, i === 0, i]
                    );
                }
            }
        }
        
        const [newListingRows] = await pool.query(
            'SELECT propertyID, ownerID, propertyName, pDescription, pAddress, pricePerNight, rooms FROM Properties WHERE propertyID = ?',
            [propertyID]
        );
        const newListing = newListingRows[0];

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

router.get('/listings', async (req, res) => {
    try {
        let query = `
            SELECT p.propertyID, p.ownerID, p.propertyName, 
                   p.pDescription, p.pAddress, 
                   p.pricePerNight, p.rooms,
                   u.fName as ownerFirstName, u.lName as ownerLastName,
                   COALESCE(AVG(r.rating), 0) as rating,
                   (SELECT imagePath FROM PropertyImages 
                    WHERE propertyID = p.propertyID 
                    AND isPrimary = TRUE 
                    LIMIT 1) as primaryImage
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

        query += ' GROUP BY p.propertyID, p.ownerID, p.propertyName, p.pDescription, p.pAddress, p.pricePerNight, p.rooms, u.fName, u.lName';

        const [result] = await pool.query(query, values);
        
        const listings = result.map(row => {
            let imageUrl = 'https://via.placeholder.com/400x400?text=No+Image';
            if (row.primaryImage) {
                // If it's a local path, prepend the backend URL
                if (row.primaryImage.startsWith('/uploads/')) {
                    imageUrl = `http://localhost:3000${row.primaryImage}`;
                } else {
                    imageUrl = row.primaryImage;
                }
            }
            
            return {
                propertyID: row.propertyID,
                ownerID: row.ownerID,
                propertyName: row.propertyName,
                pDescription: row.pDescription,
                pAddress: row.pAddress,
                pricePerNight: parseFloat(row.pricePerNight),
                rooms: row.rooms,
                imagePath: row.primaryImage,
                rating: parseFloat(row.rating) || 0,
                image: imageUrl,
                owner: row.ownerFirstName ? `${row.ownerFirstName} ${row.ownerLastName}` : null
            };
        });

        res.status(200).json(listings);
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Internal server error while fetching listings' });
    }
});

router.put('/listings/:id', authenticateToken, async (req, res) => {
    const listingId = parseInt(req.params.id);
    const updateData = req.body;
    const userId = req.user.id;

    try {
        const [existing] = await pool.query('SELECT propertyID, ownerID FROM Properties WHERE propertyID = ?', [listingId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Authorization check: Only owner can update their property
        if (existing[0].ownerID !== userId) {
            return res.status(403).json({ error: 'You are not authorized to edit this property' });
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
        if (updateData.address !== undefined) {
            updateFields.push('pAddress = ?');
            values.push(updateData.address);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(listingId);
        await pool.query(`UPDATE Properties SET ${updateFields.join(', ')} WHERE propertyID = ?`, values);

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

router.delete('/listings/:id', authenticateToken, async (req, res) => {
    const listingId = parseInt(req.params.id);
    const userId = req.user.id;

    try {
        const [existing] = await pool.query('SELECT propertyID, ownerID FROM Properties WHERE propertyID = ?', [listingId]);
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Authorization check: Only owner can delete their property
        if (existing[0].ownerID !== userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this property' });
        }

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

router.get('/listings/:id/bookings', authenticateToken, async (req, res) => {
    const listingId = parseInt(req.params.id);

    try {
        const [bookings] = await pool.query('SELECT * FROM Bookings WHERE propertyID = ?', [listingId]);
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal server error while fetching bookings' });
    }
});

router.put('/listings/:id/status', authenticateToken, async (req, res) => {
    const bookingId = parseInt(req.params.id);
    const newStatus = req.body.status;

    if (!['approved', 'denied'].includes(newStatus)) {
        return res.status(400).json({ message: 'Invalid status value. Must be "approved" or "denied".' });
    }

    try {
        const [bookings] = await pool.query('SELECT * FROM Bookings WHERE bookingID = ?', [bookingId]);
        
        if (bookings.length === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const bookingToUpdate = bookings[0];

        if (bookingToUpdate.bookingStatus === 'Pending') {
            const capitalizedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            await pool.query('UPDATE Bookings SET bookingStatus = ? WHERE bookingID = ?', [capitalizedStatus, bookingId]);

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

router.get('/users/:listerId/listings', authenticateToken, async (req, res) => {
    const listerId = parseInt(req.params.listerId);

    try {
        const [listings] = await pool.query('SELECT * FROM Properties WHERE ownerID = ?', [listerId]);
        res.status(200).json(listings);
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ error: 'Internal server error while fetching user listings' });
    }
});

router.get('/listings/:id/reviews', async (req, res) => {
    const propertyID = parseInt(req.params.id);

    try {
        const [reviews] = await pool.query(
            `SELECT r.*, u.fName, u.lName, u.username
             FROM Reviews r
             JOIN Users u ON r.renterID = u.userID
             WHERE r.propertyID = ?
             ORDER BY r.createdAt DESC`,
            [propertyID]
        );
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error while fetching reviews' });
    }
});

router.get('/listings/:id/images', async (req, res) => {
    const propertyID = parseInt(req.params.id);

    try {
        const [images] = await pool.query(
            `SELECT imageID, imagePath, isPrimary, displayOrder
             FROM PropertyImages
             WHERE propertyID = ?
             ORDER BY isPrimary DESC, displayOrder ASC`,
            [propertyID]
        );
        
        const imageUrls = images.map(img => ({
            imageID: img.imageID,
            imagePath: img.imagePath,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
            imageUrl: img.imagePath.startsWith('/uploads/') 
                ? `http://localhost:3000${img.imagePath}` 
                : img.imagePath
        }));
        
        res.status(200).json(imageUrls);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Internal server error while fetching images' });
    }
});

module.exports = router;

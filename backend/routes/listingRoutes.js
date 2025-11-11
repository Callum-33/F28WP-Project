
const router = require('express').Router();
const { readData, writeData } = require('../utils/dataHandler');

const generateId = (arr) => arr.length ? Math.max(...arr.map(item => item.id)) + 1 : 101;

router.post('/listings', (req, res) => {
    const newListingData = req.body;

    if (!newListingData.title || !newListingData.price || !newListingData.listerId) {
        return res.status(400).json({ error: 'Missing required fields: title, price, listerId' });
    }

    const listings = readData('listings.json');
    const newListing = {
        id: generateId(listings),
        listerId : newListingData.listerId,
        title: newListingData.title,
        description: newListingData.description || '',
        price: parseFloat(newListingData.price),
        location: newListingData.location || {},
        dateListed: new Date().toISOString()
    };

    listings.push(newListing);
    writeData('listings.json', listings);

    res.status(201).json({
        message: 'Listing posted successfully.',
        listing: newListing
    });
});

router.get('/listings', (req, res) => {
    const listings = readData('listings.json');
    let filteredListings = listings;
    const { location, maxPrice } = req.query;

    if (location) {
        const searchLocation = location.toLowerCase();
        filteredListings = filteredListings.filter(listing =>
        (listing.location.city && listing.location.city.toLowerCase().includes(searchLocation)) ||
        (listing.location.country && listing.location.country.toLowerCase().includes(searchLocation)) ||
        (listing.title && listing.title.toLowerCase().includes(searchLocation))
        );
    }

    if (maxPrice) {
        const priceLimit = parseFloat(maxPrice);
        if (!isNaN(priceLimit)) {
            filteredListings = filteredListings.filter(listing => listing.price <= priceLimit);
        }
    }
    res.status(200).json(filteredListings);
});

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

router.get('/users/:listerId/listings', (req, res) => {
    const listerId = parseInt(req.params.listerId);

    const listings = readData('listings.json');

    const listersListing = listings.filter(l => l.listerId === listerId);

    res.status(200).json(listersListing);
});


module.exports = router;

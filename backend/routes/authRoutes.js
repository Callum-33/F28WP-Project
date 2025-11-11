const router = require('express').Router();
const { readData, writeData } = require('../utils/dataHandler');
const { hashPassword } = require('../utils/cryptoUtils');

const generateId = (arr) => arr.length ? Math.max(...arr.map(item => item.id)) + 1 : 101;


router.post('/users/register', (req, res) => {
    const { username, password, role, email } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields: username, password, role' });
    }

    const { hash, salt } = hashPassword(password);

    const users = readData('users.json');
    if (users.some(u => u.username === username)) {
        return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = {
        id: generateId(users),
        username,
        passwordHash: hash,
        salt,
        role,
        email: email
    };

    users.push(newUser);
    writeData('users.json', users);

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

router.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const updatedData = req.body;
    const users = readData('users.json');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIddex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = users[userIndex];
    let newHash = currentUser.passwordHash;
    let newSalt = currentUser.salt;

    if (updatedData.password) {
        const { hash, salt } = hashPassword(updatedData.password);
        newHash = hash;
        newSalt = salt;
    }

    users[userIndex] = {
        ...currentUser,
        ...updatedData,
        passwordHash: newHash,
        salt: newSalt,
        id: userId
    };

    writeData('users.json', users);

    const { passwordHash, salt, ...safeUser } = users[userIndex];
    res.status(200).json({
        message: 'User updated successfully',
        user: safeUser
    });
});

router.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    let isers = readData('users.json');
    const initialUserCount = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length === initialUserCount) {
        return res.status(404).json({ message: 'User not found' });
    }

    writeData('users.json', users);
    res.status(200).json({ message: 'User deleted successfully' });

    let listings = readData('listings.json');
    listings = listings.filter(l => l.listerId !== userId);
    writeData('listings.json', listings);

    let bookings = readData('bookings.json');
    bookings = bookings.filter(b => b.userId !== userId);
    writeData('bookings.json', bookings);

    let reviews = readData('reviews.json');
    reviews = reviews.filter(r => r.userId !== userId);
    writeData('reviews.json', reviews);

    res.status(200).json({ message: 'User and associated data deleted successfully' });

});

module.exports = router;
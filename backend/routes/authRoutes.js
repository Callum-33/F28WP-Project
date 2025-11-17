const router = require('express').Router();
const pool = require('../utils/dbConnection');
const { hashPassword } = require('../utils/cryptoUtils');


// Register a new user
router.post('/users/register', async (req, res) => {
    const { username, password, role, email, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !password) {
        return res.status(400).json({ message: 'Missing required fields: username, password' });
    }

    
    try {
        const [existingUserResult] = await pool.query('SELECT userID FROM Users WHERE username = ?', [username]);
        
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Hash the password before storing
        const { hash, salt } = hashPassword(password);

        const [result] = await pool.query(
            'INSERT INTO Users (username, passwordHash, salt, role, email, fName, lName) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, hash, salt, role || 'user', email || null, firstName || '', lastName || '']
        );
        
        const [newUserRows] = await pool.query(
            'SELECT userID, username, role, email, fName, lName FROM Users WHERE userID = ?',
            [result.insertId]
        );
        const newUser = newUserRows[0];

        // Respond with the newly created user details
        res.status(201).json({ 
            message: 'User registered successfully', 
            userId: newUser.userID,
            user: {
                id: newUser.userID,
                username: newUser.username,
                role: newUser.role,
                email: newUser.email,
                firstName: newUser.fName,
                lastName: newUser.lName
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error while registering user' });
    }
});

router.put('/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { username, password, role, email, firstName, lastName } = req.body;

    try {
        const [userResult] = await pool.query('SELECT * FROM Users WHERE userID = ?', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        let updateFields = [];
        let values = [];

        if (username !== undefined) {
            updateFields.push('username = ?');
            values.push(username);
        }
        
        // Hash the password before updating
        if (password !== undefined) {
            const { hash, salt } = hashPassword(password);
            updateFields.push('passwordHash = ?', 'salt = ?');
            values.push(hash, salt);
        }
        
        // Validate role value
        if (role !== undefined) {
            updateFields.push('role = ?');
            values.push(role);
        }
        
        // Validate email format
        if (email !== undefined) {
            updateFields.push('email = ?');
            values.push(email);
        }
        
        // Validate first name
        if (firstName !== undefined) {
            updateFields.push('fName = ?');
            values.push(firstName);
        }
        
        // Validate last name
        if (lastName !== undefined) {
            updateFields.push('lName = ?');
            values.push(lastName);
        }

        // Check that there is at least one field to update
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(userId);
        await pool.query(`UPDATE Users SET ${updateFields.join(', ')} WHERE userID = ?`, values);
        
        const [updatedUserRows] = await pool.query(
            'SELECT userID, username, role, email, fName, lName FROM Users WHERE userID = ?',
            [userId]
        );
        const updatedUser = updatedUserRows[0];

        // Respond with the updated user details
        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.userID,
                username: updatedUser.username,
                role: updatedUser.role,
                email: updatedUser.email,
                firstName: updatedUser.fName,
                lastName: updatedUser.lName
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error while updating user' });
    }
});

router.delete('/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        const [userResult] = await pool.query('SELECT userID FROM Users WHERE userID = ?', [userId]);
        
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete related data first (to maintain referential integrity)
        // Delete reviews by this user
        await pool.query('DELETE FROM Reviews WHERE renterID = $1', [userId]);
        
        // Delete bookings by this user
        await pool.query('DELETE FROM Bookings WHERE renterID = $1', [userId]);
        
        // Delete properties owned by this user (and their associated bookings/reviews)
        await pool.query(`
            DELETE FROM Reviews WHERE propertyID IN 
            (SELECT propertyID FROM Properties WHERE ownerID = $1)
        `, [userId]);
        
        await pool.query(`
            DELETE FROM Bookings WHERE propertyID IN 
            (SELECT propertyID FROM Properties WHERE ownerID = $1)
        `, [userId]);
        
        await pool.query('DELETE FROM Properties WHERE ownerID = $1', [userId]);
        
        // Finally, delete the user
        await pool.query('DELETE FROM Users WHERE userID = $1', [userId]);

        // Commit the transaction
        await pool.query('COMMIT');

        res.status(200).json({ message: 'User and associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error while deleting user' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
    }

    try {
        const [userRows] = await pool.query(
            'SELECT userID, username, passwordHash, salt, role, email, fName, lName FROM Users WHERE username = ?',
            [username]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userRows[0];

        if (!verifyPassword(password, user.passwordHash, user.salt)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const sessionToken = generateSessionToken();
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.query(
            'INSERT INTO Sessions (userID, sessionToken, expiry) VALUES (?, ?, ?)',
            [user.userID, sessionToken, expiry]
        );

        res.status(200).json({
            message: 'Login successful',
            token: sessionToken,
            user: {
                id: user.userID,
                username: user.username,
                role: user.role,
                email: user.email,
                firstName: user.fName,
                lastName: user.lName
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error while logging in' });
    }
});

router.post('/logout', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
        await pool.query('DELETE FROM Sessions WHERE sessionToken = ?', [token]);
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ message: 'Internal server error while logging out' });
    }
});

module.exports = router;
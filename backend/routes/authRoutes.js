const router = require('express').Router();
const pool = require('../utils/dbConnection');
const { hashPassword, verifyPassword, generateSessionToken } = require('../utils/cryptoUtils');
const { authenticateToken } = require('../middleware/authMiddleware');


router.post('/users/register', async (req, res) => {
    const { username, password, role, email, firstName, lastName } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Missing required fields: username, password' });
    }

    try {
        // Check if username already exists
        const existingUserQuery = 'SELECT userID FROM Users WHERE username = ?';
        const [existingUserResult] = await pool.query(existingUserQuery, [username]);
        
        if (existingUserResult.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const { hash, salt } = hashPassword(password);

        const insertQuery = `
            INSERT INTO Users (username, passwordHash, salt, role, email, fName, lName)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            username,
            hash,
            salt,
            role || 'user',
            email || null,
            firstName || '',
            lastName || ''
        ];

        const [result] = await pool.query(insertQuery, values);
        
        // Get the newly created user
        const [newUserRows] = await pool.query(
            'SELECT userID, username, role, email, fName, lName FROM Users WHERE userID = ?',
            [result.insertId]
        );
        const newUser = newUserRows[0];

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

router.put('/users/:id', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id);
    const { username, password, role, email, firstName, lastName } = req.body;

    try {
        // Check if user exists
        const userExistsQuery = 'SELECT * FROM Users WHERE userID = ?';
        const [userResult] = await pool.query(userExistsQuery, [userId]);
        
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = userResult[0];
        let updateFields = [];
        let values = [];

        // Build dynamic update query
        if (username !== undefined) {
            updateFields.push('username = ?');
            values.push(username);
        }
        
        if (password !== undefined) {
            const { hash, salt } = hashPassword(password);
            updateFields.push('passwordHash = ?');
            values.push(hash);
            updateFields.push('salt = ?');
            values.push(salt);
        }
        
        if (role !== undefined) {
            updateFields.push('role = ?');
            values.push(role);
        }
        
        if (email !== undefined) {
            updateFields.push('email = ?');
            values.push(email);
        }
        
        if (firstName !== undefined) {
            updateFields.push('fName = ?');
            values.push(firstName);
        }
        
        if (lastName !== undefined) {
            updateFields.push('lName = ?');
            values.push(lastName);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const updateQuery = `
            UPDATE Users 
            SET ${updateFields.join(', ')} 
            WHERE userID = ?
        `;
        values.push(userId);

        await pool.query(updateQuery, values);
        
        // Get the updated user
        const [updatedUserRows] = await pool.query(
            'SELECT userID, username, role, email, fName, lName FROM Users WHERE userID = ?',
            [userId]
        );
        const updatedUser = updatedUserRows[0];

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

router.delete('/users/:id', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        // Check if user exists
        const userExistsQuery = 'SELECT userID FROM Users WHERE userID = ?';
        const [userResult] = await pool.query(userExistsQuery, [userId]);
        
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // MySQL with CASCADE on foreign keys will handle deletion of related records
        // But if you want to be explicit or if CASCADE is not set, delete in order:
        
        // Delete reviews by this user
        await pool.query('DELETE FROM Reviews WHERE renterID = ?', [userId]);
        
        // Delete bookings by this user
        await pool.query('DELETE FROM Bookings WHERE renterID = ?', [userId]);
        
        // Delete reviews for properties owned by this user
        await pool.query(`
            DELETE FROM Reviews WHERE propertyID IN 
            (SELECT propertyID FROM Properties WHERE ownerID = ?)
        `, [userId]);
        
        // Delete bookings for properties owned by this user
        await pool.query(`
            DELETE FROM Bookings WHERE propertyID IN 
            (SELECT propertyID FROM Properties WHERE ownerID = ?)
        `, [userId]);
        
        // Delete properties owned by this user
        await pool.query('DELETE FROM Properties WHERE ownerID = ?', [userId]);
        
        // Finally, delete the user
        await pool.query('DELETE FROM Users WHERE userID = ?', [userId]);

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
        // Get user from database
        const [userRows] = await pool.query(
            'SELECT userID, username, passwordHash, salt, role, email, fName, lName FROM Users WHERE username = ?',
            [username]
        );

        if (userRows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userRows[0];

        // Verify password
        if (!verifyPassword(password, user.passwordHash, user.salt)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate session token
        const sessionToken = generateSessionToken();
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        // Store session in database
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
        // Delete session from database
        await pool.query('DELETE FROM Sessions WHERE sessionToken = ?', [token]);
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ message: 'Internal server error while logging out' });
    }
});

module.exports = router;
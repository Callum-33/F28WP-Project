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
        const [existingUserResult] = await pool.query('SELECT userID FROM Users WHERE username = ?', [username]);
        
        if (existingUserResult.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

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
        const [userResult] = await pool.query('SELECT * FROM Users WHERE userID = ?', [userId]);
        
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        let updateFields = [];
        let values = [];

        if (username !== undefined) {
            updateFields.push('username = ?');
            values.push(username);
        }
        
        if (password !== undefined) {
            const { hash, salt } = hashPassword(password);
            updateFields.push('passwordHash = ?', 'salt = ?');
            values.push(hash, salt);
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

        values.push(userId);
        await pool.query(`UPDATE Users SET ${updateFields.join(', ')} WHERE userID = ?`, values);
        
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
        const [userResult] = await pool.query('SELECT userID FROM Users WHERE userID = ?', [userId]);
        
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

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
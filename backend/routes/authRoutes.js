const router = require('express').Router();
const pool = require('../utils/dbConnection');
const { hashPassword } = require('../utils/cryptoUtils');


router.post('/users/register', async (req, res) => {
    const { username, password, role, email, firstName, lastName } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Missing required fields: username, password' });
    }

    try {
        // Check if username already exists
        const existingUserQuery = 'SELECT userID FROM Users WHERE username = $1';
        const existingUserResult = await pool.query(existingUserQuery, [username]);
        
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const { hash, salt } = hashPassword(password);

        const insertQuery = `
            INSERT INTO Users (username, passwordHash, salt, role, email, fName, lName)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING userID, username, role, email, fName, lName
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

        const result = await pool.query(insertQuery, values);
        const newUser = result.rows[0];

        res.status(201).json({ 
            message: 'User registered successfully', 
            userId: newUser.userid,
            user: {
                id: newUser.userid,
                username: newUser.username,
                role: newUser.role,
                email: newUser.email,
                firstName: newUser.fname,
                lastName: newUser.lname
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
        // Check if user exists
        const userExistsQuery = 'SELECT * FROM Users WHERE userID = $1';
        const userResult = await pool.query(userExistsQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentUser = userResult.rows[0];
        let updateFields = [];
        let values = [];
        let paramCounter = 1;

        // Build dynamic update query
        if (username !== undefined) {
            updateFields.push(`username = $${paramCounter}`);
            values.push(username);
            paramCounter++;
        }
        
        if (password !== undefined) {
            const { hash, salt } = hashPassword(password);
            updateFields.push(`passwordHash = $${paramCounter}`);
            values.push(hash);
            paramCounter++;
            updateFields.push(`salt = $${paramCounter}`);
            values.push(salt);
            paramCounter++;
        }
        
        if (role !== undefined) {
            updateFields.push(`role = $${paramCounter}`);
            values.push(role);
            paramCounter++;
        }
        
        if (email !== undefined) {
            updateFields.push(`email = $${paramCounter}`);
            values.push(email);
            paramCounter++;
        }
        
        if (firstName !== undefined) {
            updateFields.push(`fName = $${paramCounter}`);
            values.push(firstName);
            paramCounter++;
        }
        
        if (lastName !== undefined) {
            updateFields.push(`lName = $${paramCounter}`);
            values.push(lastName);
            paramCounter++;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const updateQuery = `
            UPDATE Users 
            SET ${updateFields.join(', ')} 
            WHERE userID = $${paramCounter}
            RETURNING userID, username, role, email, fName, lName
        `;
        values.push(userId);

        const result = await pool.query(updateQuery, values);
        const updatedUser = result.rows[0];

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.userid,
                username: updatedUser.username,
                role: updatedUser.role,
                email: updatedUser.email,
                firstName: updatedUser.fname,
                lastName: updatedUser.lname
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
        // Start a transaction to ensure data consistency
        await pool.query('BEGIN');

        // Check if user exists
        const userExistsQuery = 'SELECT userID FROM Users WHERE userID = $1';
        const userResult = await pool.query(userExistsQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            await pool.query('ROLLBACK');
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
        // Rollback the transaction on error
        await pool.query('ROLLBACK');
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error while deleting user' });
    }
});

module.exports = router;
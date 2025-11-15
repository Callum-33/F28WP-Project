const pool = require('../utils/dbConnection');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    try {
        // Check if session exists and is valid
        const [sessionRows] = await pool.query(
            `SELECT s.userID, s.expiry, u.username, u.role, u.email, u.fName, u.lName 
             FROM Sessions s 
             JOIN Users u ON s.userID = u.userID 
             WHERE s.sessionToken = ? AND s.expiry > NOW()`,
            [token]
        );

        if (sessionRows.length === 0) {
            return res.status(401).json({ message: 'Invalid or expired session' });
        }

        const session = sessionRows[0];

        // Attach user info to request
        req.user = {
            id: session.userID,
            username: session.username,
            role: session.role,
            email: session.email,
            firstName: session.fName,
            lastName: session.lName
        };

        next();
    } catch (error) {
        console.error('Error authenticating token:', error);
        res.status(500).json({ message: 'Internal server error during authentication' });
    }
}

module.exports = { authenticateToken };

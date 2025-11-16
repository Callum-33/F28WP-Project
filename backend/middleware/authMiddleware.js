const pool = require('../utils/dbConnection');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    console.log('Auth middleware - Headers:', req.headers.authorization ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Auth failed: Invalid or missing Authorization header');
        return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    console.log('Token received (first 10 chars):', token.substring(0, 10));

    try {
        const [sessionRows] = await pool.query(
            `SELECT s.userID, s.expiry, u.username, u.role, u.email, u.fName, u.lName 
             FROM Sessions s 
             JOIN Users u ON s.userID = u.userID 
             WHERE s.sessionToken = ? AND s.expiry > NOW()`,
            [token]
        );

        if (sessionRows.length === 0) {
            console.log('Auth failed: Session not found or expired');
            return res.status(401).json({ message: 'Invalid or expired session' });
        }

        const session = sessionRows[0];
        console.log('Auth successful for user:', session.username);

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

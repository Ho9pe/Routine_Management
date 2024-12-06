const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Debug logging
            console.log('Auth middleware decoded token:', {
                userId: decoded.id,
                role: decoded.role,
                email: decoded.email,
                studentRoll: decoded.student_roll,
                semester: decoded.semester
            });

            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
};

module.exports = auth;
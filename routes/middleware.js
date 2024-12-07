import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Authorization Header:', req.headers.authorization);
  console.log('Token:', token);
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = decoded; // Attach user data to the request
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

export default verifyToken;
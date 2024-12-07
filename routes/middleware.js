import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract the token from "Bearer <token>"
  console.log(token)
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
     // Validate the token
    req.user = decoded; // Attach decoded token payload (e.g., user ID) to the request object
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};

export default verifyToken;
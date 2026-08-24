import jwt from 'jsonwebtoken';

export const generateToken = (userID) => {
    const token = jwt.sign(
        { userId: userID },
        process.env.JWT_SECRET
    )
    return token;
} 
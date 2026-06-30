import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface TokenPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
const accessTokenTTL = '15m';
const refreshTokenTTL = '7d';

export const signToken = (payload: TokenPayload, type: 'access' | 'refresh') => {
  const expiresIn = type === 'access' ? accessTokenTTL : refreshTokenTTL;
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, jwtSecret) as TokenPayload;
};

export const buildTokenPayload = (id: Types.ObjectId | string, role: string, type: 'access' | 'refresh'): TokenPayload => ({
  sub: id.toString(),
  role,
  type,
});

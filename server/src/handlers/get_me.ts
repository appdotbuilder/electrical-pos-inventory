import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  commission_rate: number | null;
}

export interface TokenPayload {
  userId: number;
  role: string;
  exp: number;
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (Date.now() > payload.exp) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export const getMe = async (token: string): Promise<AuthenticatedUser> => {
  try {
    // Verify and decode token
    const payload = verifyToken(token);
    
    // Get user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .execute();

    const user = users[0];
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      commission_rate: user.commission_rate ? parseFloat(user.commission_rate) : null
    };
  } catch (error) {
    console.error('Get user failed:', error);
    throw error;
  }
};
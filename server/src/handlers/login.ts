import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Simple JWT-like token generation (in production, use proper JWT library)
function generateToken(userId: number, role: string): string {
  const payload = {
    userId,
    role,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    // Find user by username or email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    let user = users[0];
    
    // If not found by username, try email
    if (!user) {
      const usersByEmail = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, input.username))
        .execute();
      user = usersByEmail[0];
    }

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    if (!verifyPassword(input.password, user.password_hash)) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active
      }
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export { generateToken, hashPassword, verifyPassword };
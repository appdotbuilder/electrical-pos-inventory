
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash the password (simple hashing for demo - use bcrypt in production)
    const password_hash = `hashed_${input.password}`;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: password_hash,
        full_name: input.full_name,
        role: input.role,
        commission_rate: input.commission_rate ? input.commission_rate.toString() : null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const user = result[0];
    return {
      ...user,
      commission_rate: user.commission_rate ? parseFloat(user.commission_rate) : null
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

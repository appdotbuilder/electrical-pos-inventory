import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getUsers = async (): Promise<User[]> => {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.is_active, true))
      .execute();

    return results.map(user => ({
      ...user,
      commission_rate: user.commission_rate ? parseFloat(user.commission_rate) : null
    }));
  } catch (error) {
    console.error('Failed to get users:', error);
    throw error;
  }
};
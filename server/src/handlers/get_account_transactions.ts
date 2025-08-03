
import { db } from '../db';
import { accountTransactionsTable } from '../db/schema';
import { type AccountTransaction } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getAccountTransactions = async (type?: 'RECEIVABLE' | 'PAYABLE', status?: string): Promise<AccountTransaction[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (type) {
      conditions.push(eq(accountTransactionsTable.type, type));
    }

    if (status) {
      conditions.push(eq(accountTransactionsTable.status, status as any));
    }

    // Build final query with conditional where clause
    const results = conditions.length > 0
      ? await db.select()
          .from(accountTransactionsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(accountTransactionsTable)
          .execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Failed to get account transactions:', error);
    throw error;
  }
};

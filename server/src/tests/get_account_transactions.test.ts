
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, accountTransactionsTable } from '../db/schema';
import { getAccountTransactions } from '../handlers/get_account_transactions';

describe('getAccountTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all account transactions when no filters are provided', async () => {
    // Create a user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test transactions
    await db.insert(accountTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer A',
          description: 'Invoice payment',
          amount: '1000.00',
          due_date: new Date('2024-01-15'),
          status: 'PENDING',
          created_by: userId
        },
        {
          transaction_number: 'TXN002',
          type: 'PAYABLE',
          customer_supplier: 'Supplier B',
          description: 'Purchase payment',
          amount: '750.50',
          due_date: new Date('2024-01-20'),
          status: 'PAID',
          created_by: userId
        }
      ])
      .execute();

    const result = await getAccountTransactions();

    expect(result).toHaveLength(2);
    expect(result[0].transaction_number).toEqual('TXN001');
    expect(result[0].type).toEqual('RECEIVABLE');
    expect(result[0].amount).toEqual(1000.00);
    expect(typeof result[0].amount).toEqual('number');
    expect(result[1].transaction_number).toEqual('TXN002');
    expect(result[1].type).toEqual('PAYABLE');
    expect(result[1].amount).toEqual(750.50);
  });

  it('should filter by transaction type', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test transactions of different types
    await db.insert(accountTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer A',
          description: 'Invoice payment',
          amount: '1000.00',
          due_date: new Date('2024-01-15'),
          status: 'PENDING',
          created_by: userId
        },
        {
          transaction_number: 'TXN002',
          type: 'PAYABLE',
          customer_supplier: 'Supplier B',
          description: 'Purchase payment',
          amount: '750.50',
          due_date: new Date('2024-01-20'),
          status: 'PENDING',
          created_by: userId
        },
        {
          transaction_number: 'TXN003',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer C',
          description: 'Service payment',
          amount: '500.00',
          due_date: new Date('2024-01-25'),
          status: 'PAID',
          created_by: userId
        }
      ])
      .execute();

    const receivableResult = await getAccountTransactions('RECEIVABLE');
    expect(receivableResult).toHaveLength(2);
    receivableResult.forEach(transaction => {
      expect(transaction.type).toEqual('RECEIVABLE');
    });

    const payableResult = await getAccountTransactions('PAYABLE');
    expect(payableResult).toHaveLength(1);
    expect(payableResult[0].type).toEqual('PAYABLE');
    expect(payableResult[0].transaction_number).toEqual('TXN002');
  });

  it('should filter by status', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test transactions with different statuses
    await db.insert(accountTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer A',
          description: 'Invoice payment',
          amount: '1000.00',
          due_date: new Date('2024-01-15'),
          status: 'PENDING',
          created_by: userId
        },
        {
          transaction_number: 'TXN002',
          type: 'PAYABLE',
          customer_supplier: 'Supplier B',
          description: 'Purchase payment',
          amount: '750.50',
          due_date: new Date('2024-01-20'),
          status: 'PAID',
          created_by: userId
        },
        {
          transaction_number: 'TXN003',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer C',
          description: 'Service payment',
          amount: '500.00',
          due_date: new Date('2024-01-25'),
          status: 'OVERDUE',
          created_by: userId
        }
      ])
      .execute();

    const pendingResult = await getAccountTransactions(undefined, 'PENDING');
    expect(pendingResult).toHaveLength(1);
    expect(pendingResult[0].status).toEqual('PENDING');
    expect(pendingResult[0].transaction_number).toEqual('TXN001');

    const paidResult = await getAccountTransactions(undefined, 'PAID');
    expect(paidResult).toHaveLength(1);
    expect(paidResult[0].status).toEqual('PAID');
    expect(paidResult[0].transaction_number).toEqual('TXN002');
  });

  it('should filter by both type and status', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test transactions with different combinations
    await db.insert(accountTransactionsTable)
      .values([
        {
          transaction_number: 'TXN001',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer A',
          description: 'Invoice payment',
          amount: '1000.00',
          due_date: new Date('2024-01-15'),
          status: 'PENDING',
          created_by: userId
        },
        {
          transaction_number: 'TXN002',
          type: 'PAYABLE',
          customer_supplier: 'Supplier B',
          description: 'Purchase payment',
          amount: '750.50',
          due_date: new Date('2024-01-20'),
          status: 'PENDING',
          created_by: userId
        },
        {
          transaction_number: 'TXN003',
          type: 'RECEIVABLE',
          customer_supplier: 'Customer C',
          description: 'Service payment',
          amount: '500.00',
          due_date: new Date('2024-01-25'),
          status: 'PAID',
          created_by: userId
        }
      ])
      .execute();

    const result = await getAccountTransactions('RECEIVABLE', 'PENDING');
    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('RECEIVABLE');
    expect(result[0].status).toEqual('PENDING');
    expect(result[0].transaction_number).toEqual('TXN001');
    expect(result[0].amount).toEqual(1000.00);
    expect(typeof result[0].amount).toEqual('number');
  });

  it('should return empty array when no transactions match filters', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'CASHIER'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a transaction that won't match our filter
    await db.insert(accountTransactionsTable)
      .values({
        transaction_number: 'TXN001',
        type: 'RECEIVABLE',
        customer_supplier: 'Customer A',
        description: 'Invoice payment',
        amount: '1000.00',
        due_date: new Date('2024-01-15'),
        status: 'PENDING',
        created_by: userId
      })
      .execute();

    const result = await getAccountTransactions('PAYABLE', 'PAID');
    expect(result).toHaveLength(0);
  });
});

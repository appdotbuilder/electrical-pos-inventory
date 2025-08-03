
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const testManagerInput: CreateUserInput = {
  username: 'testmanager',
  email: 'manager@test.com',
  password: 'password123',
  full_name: 'Test Manager',
  role: 'MANAGER',
  commission_rate: 5.5
};

const testCashierInput: CreateUserInput = {
  username: 'testcashier',
  email: 'cashier@test.com',
  password: 'password456',
  full_name: 'Test Cashier',
  role: 'CASHIER',
  commission_rate: null
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with commission rate', async () => {
    const result = await createUser(testManagerInput);

    // Basic field validation
    expect(result.username).toEqual('testmanager');
    expect(result.email).toEqual('manager@test.com');
    expect(result.full_name).toEqual('Test Manager');
    expect(result.role).toEqual('MANAGER');
    expect(result.commission_rate).toEqual(5.5);
    expect(typeof result.commission_rate).toBe('number');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toContain('hashed_');
  });

  it('should create a user without commission rate', async () => {
    const result = await createUser(testCashierInput);

    // Basic field validation
    expect(result.username).toEqual('testcashier');
    expect(result.email).toEqual('cashier@test.com');
    expect(result.full_name).toEqual('Test Cashier');
    expect(result.role).toEqual('CASHIER');
    expect(result.commission_rate).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testManagerInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testmanager');
    expect(users[0].email).toEqual('manager@test.com');
    expect(users[0].full_name).toEqual('Test Manager');
    expect(users[0].role).toEqual('MANAGER');
    expect(parseFloat(users[0].commission_rate!)).toEqual(5.5);
    expect(users[0].is_active).toBe(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different user roles correctly', async () => {
    const adminInput: CreateUserInput = {
      username: 'admin',
      email: 'admin@test.com',
      password: 'adminpass',
      full_name: 'System Admin',
      role: 'SYSTEM_ADMIN',
      commission_rate: null
    };

    const result = await createUser(adminInput);

    expect(result.role).toEqual('SYSTEM_ADMIN');
    expect(result.commission_rate).toBeNull();

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, 'admin'))
      .execute();

    expect(users[0].role).toEqual('SYSTEM_ADMIN');
    expect(users[0].commission_rate).toBeNull();
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await createUser(testManagerInput);

    // Try to create user with same username
    const duplicateInput: CreateUserInput = {
      ...testManagerInput,
      email: 'different@email.com'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await createUser(testManagerInput);

    // Try to create user with same email
    const duplicateInput: CreateUserInput = {
      ...testManagerInput,
      username: 'differentuser'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});

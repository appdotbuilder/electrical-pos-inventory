import { db } from '../db';
import { usersTable, warehousesTable } from '../db/schema';
import { hashPassword } from './login';

export const seedTestData = async () => {
  // Only allow seeding in development/test environments
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test data seeding is not allowed in production');
  }
  
  try {
    // Create test users
    const testUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashPassword('admin123'),
        full_name: 'System Administrator',
        role: 'SYSTEM_ADMIN' as const,
        commission_rate: null
      },
      {
        username: 'manager',
        email: 'manager@example.com',
        password_hash: hashPassword('manager123'),
        full_name: 'Store Manager',
        role: 'MANAGER' as const,
        commission_rate: null
      },
      {
        username: 'cashier',
        email: 'cashier@example.com',
        password_hash: hashPassword('cashier123'),
        full_name: 'Store Cashier',
        role: 'CASHIER' as const,
        commission_rate: '5.00'
      }
    ];

    const createdUsers = await db.insert(usersTable)
      .values(testUsers)
      .returning()
      .execute();

    // Create test warehouses
    const testWarehouses = [
      {
        name: 'Main Store',
        type: 'PHYSICAL' as const,
        address: '123 Main Street, City',
        manager_id: createdUsers.find(u => u.role === 'MANAGER')?.id || null
      },
      {
        name: 'Online Store Warehouse',
        type: 'ONLINE' as const,
        address: '456 Storage Ave, City',
        manager_id: createdUsers.find(u => u.role === 'MANAGER')?.id || null
      }
    ];

    const createdWarehouses = await db.insert(warehousesTable)
      .values(testWarehouses)
      .returning()
      .execute();

    console.log('Test data seeded successfully:');
    console.log('Users created:', createdUsers.length);
    console.log('Warehouses created:', createdWarehouses.length);
    console.log('\nTest login credentials:');
    console.log('Admin: username="admin", password="admin123"');
    console.log('Manager: username="manager", password="manager123"');
    console.log('Cashier: username="cashier", password="cashier123"');

    return {
      users: createdUsers,
      warehouses: createdWarehouses
    };
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
};
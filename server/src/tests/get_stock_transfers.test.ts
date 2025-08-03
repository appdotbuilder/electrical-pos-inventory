
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, warehousesTable, stockTransfersTable } from '../db/schema';
import { getStockTransfers } from '../handlers/get_stock_transfers';

describe('getStockTransfers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all stock transfers when no status filter is provided', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouseResults = await db.insert(warehousesTable)
      .values([
        {
          name: 'Warehouse A',
          type: 'PHYSICAL',
          address: '123 Main St'
        },
        {
          name: 'Warehouse B',
          type: 'PHYSICAL',
          address: '456 Oak Ave'
        }
      ])
      .returning()
      .execute();

    // Create test stock transfers
    await db.insert(stockTransfersTable)
      .values([
        {
          transfer_number: 'TR001',
          from_warehouse_id: warehouseResults[0].id,
          to_warehouse_id: warehouseResults[1].id,
          requested_by: userResult[0].id,
          status: 'PENDING'
        },
        {
          transfer_number: 'TR002',
          from_warehouse_id: warehouseResults[1].id,
          to_warehouse_id: warehouseResults[0].id,
          requested_by: userResult[0].id,
          status: 'COMPLETED'
        }
      ])
      .execute();

    const result = await getStockTransfers();

    expect(result).toHaveLength(2);
    expect(result[0].transfer_number).toEqual('TR001');
    expect(result[0].status).toEqual('PENDING');
    expect(result[1].transfer_number).toEqual('TR002');
    expect(result[1].status).toEqual('COMPLETED');
    
    // Verify all required fields are present
    result.forEach(transfer => {
      expect(transfer.id).toBeDefined();
      expect(transfer.transfer_number).toBeDefined();
      expect(transfer.from_warehouse_id).toBeDefined();
      expect(transfer.to_warehouse_id).toBeDefined();
      expect(transfer.requested_by).toBeDefined();
      expect(transfer.status).toBeDefined();
      expect(transfer.created_at).toBeInstanceOf(Date);
      expect(transfer.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter stock transfers by status', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouseResults = await db.insert(warehousesTable)
      .values([
        {
          name: 'Warehouse A',
          type: 'PHYSICAL'
        },
        {
          name: 'Warehouse B',
          type: 'PHYSICAL'
        }
      ])
      .returning()
      .execute();

    // Create transfers with different statuses
    await db.insert(stockTransfersTable)
      .values([
        {
          transfer_number: 'TR001',
          from_warehouse_id: warehouseResults[0].id,
          to_warehouse_id: warehouseResults[1].id,
          requested_by: userResult[0].id,
          status: 'PENDING'
        },
        {
          transfer_number: 'TR002',
          from_warehouse_id: warehouseResults[1].id,
          to_warehouse_id: warehouseResults[0].id,
          requested_by: userResult[0].id,
          status: 'COMPLETED'
        },
        {
          transfer_number: 'TR003',
          from_warehouse_id: warehouseResults[0].id,
          to_warehouse_id: warehouseResults[1].id,
          requested_by: userResult[0].id,
          status: 'PENDING'
        }
      ])
      .execute();

    const pendingTransfers = await getStockTransfers('PENDING');
    const completedTransfers = await getStockTransfers('COMPLETED');

    expect(pendingTransfers).toHaveLength(2);
    expect(completedTransfers).toHaveLength(1);
    
    pendingTransfers.forEach(transfer => {
      expect(transfer.status).toEqual('PENDING');
    });
    
    completedTransfers.forEach(transfer => {
      expect(transfer.status).toEqual('COMPLETED');
    });
  });

  it('should return empty array when no transfers match the status filter', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'MANAGER'
      })
      .returning()
      .execute();

    const warehouseResults = await db.insert(warehousesTable)
      .values([
        {
          name: 'Warehouse A',
          type: 'PHYSICAL'
        },
        {
          name: 'Warehouse B',
          type: 'PHYSICAL'
        }
      ])
      .returning()
      .execute();

    // Create only PENDING transfers
    await db.insert(stockTransfersTable)
      .values({
        transfer_number: 'TR001',
        from_warehouse_id: warehouseResults[0].id,
        to_warehouse_id: warehouseResults[1].id,
        requested_by: userResult[0].id,
        status: 'PENDING'
      })
      .execute();

    const completedTransfers = await getStockTransfers('COMPLETED');

    expect(completedTransfers).toHaveLength(0);
  });

  it('should return empty array when no transfers exist', async () => {
    const result = await getStockTransfers();

    expect(result).toHaveLength(0);
  });
});

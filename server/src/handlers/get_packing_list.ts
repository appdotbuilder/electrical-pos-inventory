
import { db } from '../db';
import { packingTable, salesTable, usersTable } from '../db/schema';
import { type Packing } from '../schema';
import { eq, and } from 'drizzle-orm';
import { type SQL } from 'drizzle-orm';

export const getPackingList = async (status?: string): Promise<Packing[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Filter for online sales only
    conditions.push(eq(salesTable.sale_type, 'ONLINE'));
    
    // Add status filter if provided
    if (status) {
      conditions.push(eq(packingTable.status, status as any));
    }

    // Build and execute query with joins
    const query = db.select({
      id: packingTable.id,
      sale_id: packingTable.sale_id,
      packer_id: packingTable.packer_id,
      status: packingTable.status,
      packed_date: packingTable.packed_date,
      shipped_date: packingTable.shipped_date,
      tracking_info: packingTable.tracking_info,
      notes: packingTable.notes,
      created_at: packingTable.created_at,
      updated_at: packingTable.updated_at
    })
    .from(packingTable)
    .innerJoin(salesTable, eq(packingTable.sale_id, salesTable.id))
    .leftJoin(usersTable, eq(packingTable.packer_id, usersTable.id))
    .where(and(...conditions));

    const results = await query.execute();

    // Return results with proper typing
    return results.map(result => ({
      id: result.id,
      sale_id: result.sale_id,
      packer_id: result.packer_id,
      status: result.status,
      packed_date: result.packed_date,
      shipped_date: result.shipped_date,
      tracking_info: result.tracking_info,
      notes: result.notes,
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch packing list:', error);
    throw error;
  }
};

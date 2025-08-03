
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  pgEnum,
  varchar,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE']);
export const warehouseTypeEnum = pgEnum('warehouse_type', ['PHYSICAL', 'ONLINE']);
export const saleTypeEnum = pgEnum('sale_type', ['RETAIL', 'WHOLESALE', 'ONLINE']);
export const saleStatusEnum = pgEnum('sale_status', ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']);
export const transferStatusEnum = pgEnum('transfer_status', ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']);
export const packingStatusEnum = pgEnum('packing_status', ['PENDING', 'IN_PROGRESS', 'PACKED', 'SHIPPED']);
export const transactionTypeEnum = pgEnum('transaction_type', ['RECEIVABLE', 'PAYABLE']);
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: varchar('full_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  commission_rate: numeric('commission_rate', { precision: 5, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Warehouses table
export const warehousesTable = pgTable('warehouses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: warehouseTypeEnum('type').notNull(),
  address: text('address'),
  manager_id: integer('manager_id').references(() => usersTable.id),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Product categories table - Fix self-reference by using a function
export const productCategoriesTable = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parent_id: integer('parent_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Unit conversions table
export const unitConversionsTable = pgTable('unit_conversions', {
  id: serial('id').primaryKey(),
  from_unit: varchar('from_unit', { length: 20 }).notNull(),
  to_unit: varchar('to_unit', { length: 20 }).notNull(),
  conversion_factor: numeric('conversion_factor', { precision: 10, scale: 4 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  unitPairIdx: unique().on(table.from_unit, table.to_unit)
}));

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category_id: integer('category_id').references(() => productCategoriesTable.id),
  base_unit: varchar('base_unit', { length: 20 }).notNull(),
  cost_price: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  retail_price: numeric('retail_price', { precision: 12, scale: 2 }).notNull(),
  wholesale_price: numeric('wholesale_price', { precision: 12, scale: 2 }).notNull(),
  minimum_stock_level: integer('minimum_stock_level').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  skuIdx: index('products_sku_idx').on(table.sku),
  nameIdx: index('products_name_idx').on(table.name)
}));

// Online store pricing table
export const onlineStorePricingTable = pgTable('online_store_pricing', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').references(() => productsTable.id).notNull(),
  warehouse_id: integer('warehouse_id').references(() => warehousesTable.id).notNull(),
  selling_price: numeric('selling_price', { precision: 12, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  productWarehouseIdx: unique().on(table.product_id, table.warehouse_id)
}));

// Inventory table
export const inventoryTable = pgTable('inventory', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').references(() => productsTable.id).notNull(),
  warehouse_id: integer('warehouse_id').references(() => warehousesTable.id).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull().default('0'),
  reserved_quantity: numeric('reserved_quantity', { precision: 12, scale: 2 }).notNull().default('0'),
  last_updated: timestamp('last_updated').defaultNow().notNull()
}, (table) => ({
  productWarehouseIdx: unique().on(table.product_id, table.warehouse_id),
  quantityIdx: index('inventory_quantity_idx').on(table.quantity)
}));

// Sales table
export const salesTable = pgTable('sales', {
  id: serial('id').primaryKey(),
  sale_number: varchar('sale_number', { length: 50 }).notNull().unique(),
  warehouse_id: integer('warehouse_id').references(() => warehousesTable.id).notNull(),
  cashier_id: integer('cashier_id').references(() => usersTable.id),
  customer_name: varchar('customer_name', { length: 100 }),
  customer_contact: varchar('customer_contact', { length: 100 }),
  sale_type: saleTypeEnum('sale_type').notNull(),
  status: saleStatusEnum('status').notNull().default('PENDING'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  tax_amount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  discount_amount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  commission_amount: numeric('commission_amount', { precision: 12, scale: 2 }),
  tracking_number: varchar('tracking_number', { length: 100 }),
  notes: text('notes'),
  sale_date: timestamp('sale_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  saleNumberIdx: index('sales_sale_number_idx').on(table.sale_number),
  saleDateIdx: index('sales_sale_date_idx').on(table.sale_date),
  warehouseIdx: index('sales_warehouse_idx').on(table.warehouse_id)
}));

// Sale items table
export const saleItemsTable = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').references(() => salesTable.id).notNull(),
  product_id: integer('product_id').references(() => productsTable.id).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  cost_price: numeric('cost_price', { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Stock transfers table
export const stockTransfersTable = pgTable('stock_transfers', {
  id: serial('id').primaryKey(),
  transfer_number: varchar('transfer_number', { length: 50 }).notNull().unique(),
  from_warehouse_id: integer('from_warehouse_id').references(() => warehousesTable.id).notNull(),
  to_warehouse_id: integer('to_warehouse_id').references(() => warehousesTable.id).notNull(),
  requested_by: integer('requested_by').references(() => usersTable.id).notNull(),
  approved_by: integer('approved_by').references(() => usersTable.id),
  status: transferStatusEnum('status').notNull().default('PENDING'),
  transfer_date: timestamp('transfer_date'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  transferNumberIdx: index('stock_transfers_transfer_number_idx').on(table.transfer_number),
  statusIdx: index('stock_transfers_status_idx').on(table.status)
}));

// Stock transfer items table
export const stockTransferItemsTable = pgTable('stock_transfer_items', {
  id: serial('id').primaryKey(),
  transfer_id: integer('transfer_id').references(() => stockTransfersTable.id).notNull(),
  product_id: integer('product_id').references(() => productsTable.id).notNull(),
  requested_quantity: numeric('requested_quantity', { precision: 12, scale: 2 }).notNull(),
  transferred_quantity: numeric('transferred_quantity', { precision: 12, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Packing table
export const packingTable = pgTable('packing', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').references(() => salesTable.id).notNull(),
  packer_id: integer('packer_id').references(() => usersTable.id),
  status: packingStatusEnum('status').notNull().default('PENDING'),
  packed_date: timestamp('packed_date'),
  shipped_date: timestamp('shipped_date'),
  tracking_info: text('tracking_info'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  statusIdx: index('packing_status_idx').on(table.status),
  saleIdx: unique().on(table.sale_id)
}));

// Account transactions table
export const accountTransactionsTable = pgTable('account_transactions', {
  id: serial('id').primaryKey(),
  transaction_number: varchar('transaction_number', { length: 50 }).notNull().unique(),
  type: transactionTypeEnum('type').notNull(),
  customer_supplier: varchar('customer_supplier', { length: 200 }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  due_date: timestamp('due_date').notNull(),
  status: transactionStatusEnum('status').notNull().default('PENDING'),
  paid_date: timestamp('paid_date'),
  payment_reference: varchar('payment_reference', { length: 100 }),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  transactionNumberIdx: index('account_transactions_transaction_number_idx').on(table.transaction_number),
  statusIdx: index('account_transactions_status_idx').on(table.status),
  dueDateIdx: index('account_transactions_due_date_idx').on(table.due_date)
}));

// Define relations - Fix by adding explicit return type annotations
export const usersRelations = relations(usersTable, ({ many }) => ({
  managedWarehouses: many(warehousesTable),
  sales: many(salesTable),
  requestedTransfers: many(stockTransfersTable, { relationName: 'requestedBy' }),
  approvedTransfers: many(stockTransfersTable, { relationName: 'approvedBy' }),
  packingAssignments: many(packingTable),
  accountTransactions: many(accountTransactionsTable)
}));

export const warehousesRelations = relations(warehousesTable, ({ one, many }) => ({
  manager: one(usersTable, {
    fields: [warehousesTable.manager_id],
    references: [usersTable.id]
  }),
  inventory: many(inventoryTable),
  sales: many(salesTable),
  onlineStorePricing: many(onlineStorePricingTable),
  outgoingTransfers: many(stockTransfersTable, { relationName: 'fromWarehouse' }),
  incomingTransfers: many(stockTransfersTable, { relationName: 'toWarehouse' })
}));

export const productCategoriesRelations = relations(productCategoriesTable, ({ one, many }) => ({
  parent: one(productCategoriesTable, {
    fields: [productCategoriesTable.parent_id],
    references: [productCategoriesTable.id]
  }),
  children: many(productCategoriesTable),
  products: many(productsTable)
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(productCategoriesTable, {
    fields: [productsTable.category_id],
    references: [productCategoriesTable.id]
  }),
  inventory: many(inventoryTable),
  saleItems: many(saleItemsTable),
  onlineStorePricing: many(onlineStorePricingTable),
  transferItems: many(stockTransferItemsTable)
}));

export const inventoryRelations = relations(inventoryTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [inventoryTable.product_id],
    references: [productsTable.id]
  }),
  warehouse: one(warehousesTable, {
    fields: [inventoryTable.warehouse_id],
    references: [warehousesTable.id]
  })
}));

export const salesRelations = relations(salesTable, ({ one, many }) => ({
  warehouse: one(warehousesTable, {
    fields: [salesTable.warehouse_id],
    references: [warehousesTable.id]
  }),
  cashier: one(usersTable, {
    fields: [salesTable.cashier_id],
    references: [usersTable.id]
  }),
  items: many(saleItemsTable),
  packing: one(packingTable)
}));

export const saleItemsRelations = relations(saleItemsTable, ({ one }) => ({
  sale: one(salesTable, {
    fields: [saleItemsTable.sale_id],
    references: [salesTable.id]
  }),
  product: one(productsTable, {
    fields: [saleItemsTable.product_id],
    references: [productsTable.id]
  })
}));

export const stockTransfersRelations = relations(stockTransfersTable, ({ one, many }) => ({
  fromWarehouse: one(warehousesTable, {
    fields: [stockTransfersTable.from_warehouse_id],
    references: [warehousesTable.id],
    relationName: 'fromWarehouse'
  }),
  toWarehouse: one(warehousesTable, {
    fields: [stockTransfersTable.to_warehouse_id],
    references: [warehousesTable.id],
    relationName: 'toWarehouse'
  }),
  requestedBy: one(usersTable, {
    fields: [stockTransfersTable.requested_by],
    references: [usersTable.id],
    relationName: 'requestedBy'
  }),
  approvedBy: one(usersTable, {
    fields: [stockTransfersTable.approved_by],
    references: [usersTable.id],
    relationName: 'approvedBy'
  }),
  items: many(stockTransferItemsTable)
}));

export const stockTransferItemsRelations = relations(stockTransferItemsTable, ({ one }) => ({
  transfer: one(stockTransfersTable, {
    fields: [stockTransferItemsTable.transfer_id],
    references: [stockTransfersTable.id]
  }),
  product: one(productsTable, {
    fields: [stockTransferItemsTable.product_id],
    references: [productsTable.id]
  })
}));

export const packingRelations = relations(packingTable, ({ one }) => ({
  sale: one(salesTable, {
    fields: [packingTable.sale_id],
    references: [salesTable.id]
  }),
  packer: one(usersTable, {
    fields: [packingTable.packer_id],
    references: [usersTable.id]
  })
}));

export const accountTransactionsRelations = relations(accountTransactionsTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [accountTransactionsTable.created_by],
    references: [usersTable.id]
  })
}));

export const onlineStorePricingRelations = relations(onlineStorePricingTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [onlineStorePricingTable.product_id],
    references: [productsTable.id]
  }),
  warehouse: one(warehousesTable, {
    fields: [onlineStorePricingTable.warehouse_id],
    references: [warehousesTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  warehouses: warehousesTable,
  productCategories: productCategoriesTable,
  unitConversions: unitConversionsTable,
  products: productsTable,
  onlineStorePricing: onlineStorePricingTable,
  inventory: inventoryTable,
  sales: salesTable,
  saleItems: saleItemsTable,
  stockTransfers: stockTransfersTable,
  stockTransferItems: stockTransferItemsTable,
  packing: packingTable,
  accountTransactions: accountTransactionsTable
};

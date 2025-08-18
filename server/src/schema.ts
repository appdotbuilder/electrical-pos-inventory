
import { z } from 'zod';

// Enums
export const userRoleEnum = z.enum(['SYSTEM_ADMIN', 'APP_ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE']);
export const warehouseTypeEnum = z.enum(['PHYSICAL', 'ONLINE']);
export const saleTypeEnum = z.enum(['RETAIL', 'WHOLESALE', 'ONLINE']);
export const saleStatusEnum = z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']);
export const transferStatusEnum = z.enum(['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']);
export const packingStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'PACKED', 'SHIPPED']);
export const transactionTypeEnum = z.enum(['RECEIVABLE', 'PAYABLE']);
export const transactionStatusEnum = z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  commission_rate: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Warehouse schema
export const warehouseSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: warehouseTypeEnum,
  address: z.string().nullable(),
  manager_id: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Warehouse = z.infer<typeof warehouseSchema>;

// Product category schema
export const productCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  parent_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ProductCategory = z.infer<typeof productCategorySchema>;

// Unit conversion schema
export const unitConversionSchema = z.object({
  id: z.number(),
  from_unit: z.string(),
  to_unit: z.string(),
  conversion_factor: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UnitConversion = z.infer<typeof unitConversionSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category_id: z.number().nullable(),
  base_unit: z.string(),
  cost_price: z.number(),
  retail_price: z.number(),
  wholesale_price: z.number(),
  minimum_stock_level: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Online store pricing schema
export const onlineStorePricingSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  warehouse_id: z.number(),
  selling_price: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type OnlineStorePricing = z.infer<typeof onlineStorePricingSchema>;

// Inventory schema
export const inventorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  warehouse_id: z.number(),
  quantity: z.number(),
  reserved_quantity: z.number(),
  last_updated: z.coerce.date()
});

export type Inventory = z.infer<typeof inventorySchema>;

// Sale schema
export const saleSchema = z.object({
  id: z.number(),
  sale_number: z.string(),
  warehouse_id: z.number(),
  cashier_id: z.number().nullable(),
  customer_name: z.string().nullable(),
  customer_contact: z.string().nullable(),
  sale_type: saleTypeEnum,
  status: saleStatusEnum,
  subtotal: z.number(),
  tax_amount: z.number(),
  discount_amount: z.number(),
  total_amount: z.number(),
  commission_amount: z.number().nullable(),
  tracking_number: z.string().nullable(),
  notes: z.string().nullable(),
  sale_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Sale = z.infer<typeof saleSchema>;

// Sale item schema
export const saleItemSchema = z.object({
  id: z.number(),
  sale_id: z.number(),
  product_id: z.number(),
  quantity: z.number(),
  unit_price: z.number(),
  discount_amount: z.number(),
  total_amount: z.number(),
  cost_price: z.number(),
  created_at: z.coerce.date()
});

export type SaleItem = z.infer<typeof saleItemSchema>;

// Stock transfer schema
export const stockTransferSchema = z.object({
  id: z.number(),
  transfer_number: z.string(),
  from_warehouse_id: z.number(),
  to_warehouse_id: z.number(),
  requested_by: z.number(),
  approved_by: z.number().nullable(),
  status: transferStatusEnum,
  transfer_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StockTransfer = z.infer<typeof stockTransferSchema>;

// Stock transfer item schema
export const stockTransferItemSchema = z.object({
  id: z.number(),
  transfer_id: z.number(),
  product_id: z.number(),
  requested_quantity: z.number(),
  transferred_quantity: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StockTransferItem = z.infer<typeof stockTransferItemSchema>;

// Packing schema
export const packingSchema = z.object({
  id: z.number(),
  sale_id: z.number(),
  packer_id: z.number().nullable(),
  status: packingStatusEnum,
  packed_date: z.coerce.date().nullable(),
  shipped_date: z.coerce.date().nullable(),
  tracking_info: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Packing = z.infer<typeof packingSchema>;

// Account transaction schema
export const accountTransactionSchema = z.object({
  id: z.number(),
  transaction_number: z.string(),
  type: transactionTypeEnum,
  customer_supplier: z.string(),
  description: z.string(),
  amount: z.number(),
  due_date: z.coerce.date(),
  status: transactionStatusEnum,
  paid_date: z.coerce.date().nullable(),
  payment_reference: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AccountTransaction = z.infer<typeof accountTransactionSchema>;

// Input schemas for creating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string(),
  role: userRoleEnum,
  commission_rate: z.number().min(0).max(100).nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createWarehouseInputSchema = z.object({
  name: z.string(),
  type: warehouseTypeEnum,
  address: z.string().nullable(),
  manager_id: z.number().nullable()
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseInputSchema>;

export const createProductInputSchema = z.object({
  sku: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category_id: z.number().nullable(),
  base_unit: z.string(),
  cost_price: z.number().positive(),
  retail_price: z.number().positive(),
  wholesale_price: z.number().positive(),
  minimum_stock_level: z.number().min(0)
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createSaleInputSchema = z.object({
  warehouse_id: z.number(),
  customer_name: z.string().nullable(),
  customer_contact: z.string().nullable(),
  sale_type: saleTypeEnum,
  tracking_number: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    discount_amount: z.number().min(0)
  }))
});

export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

export const createStockTransferInputSchema = z.object({
  from_warehouse_id: z.number(),
  to_warehouse_id: z.number(),
  notes: z.string().nullable(),
  items: z.array(z.object({
    product_id: z.number(),
    requested_quantity: z.number().positive()
  }))
});

export type CreateStockTransferInput = z.infer<typeof createStockTransferInputSchema>;

export const updateInventoryInputSchema = z.object({
  product_id: z.number(),
  warehouse_id: z.number(),
  quantity: z.number().min(0)
});

export type UpdateInventoryInput = z.infer<typeof updateInventoryInputSchema>;

// Report input schemas
export const salesReportInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  warehouse_id: z.number().nullable(),
  sale_type: saleTypeEnum.nullable()
});

export type SalesReportInput = z.infer<typeof salesReportInputSchema>;

export const profitReportInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  warehouse_id: z.number().nullable(),
  product_id: z.number().nullable()
});

export type ProfitReportInput = z.infer<typeof profitReportInputSchema>;

// Authentication schemas
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authenticatedUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  commission_rate: z.number().nullable()
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    full_name: z.string(),
    role: z.string(),
    is_active: z.boolean()
  })
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

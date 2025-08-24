
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createWarehouseInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  deleteProductInputSchema,
  createSaleInputSchema,
  createStockTransferInputSchema,
  updateInventoryInputSchema,
  salesReportInputSchema,
  profitReportInputSchema,
  loginInputSchema,
  getProductsInputSchema,
  getStockTransferDetailsInputSchema,
  cancelStockTransferInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createWarehouse } from './handlers/create_warehouse';
import { createProduct } from './handlers/create_product';
import { updateProduct } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';
import { createSale } from './handlers/create_sale';
import { createStockTransfer } from './handlers/create_stock_transfer';
import { updateInventory } from './handlers/update_inventory';
import { getProducts } from './handlers/get_products';
import { getWarehouses } from './handlers/get_warehouses';
import { getInventory } from './handlers/get_inventory';
import { getSales } from './handlers/get_sales';
import { getStockTransfers } from './handlers/get_stock_transfers';
import { getPackingList } from './handlers/get_packing_list';
import { getAccountTransactions } from './handlers/get_account_transactions';
import { generateSalesReport } from './handlers/generate_sales_report';
import { generateProfitReport } from './handlers/generate_profit_report';
import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { getUsers } from './handlers/get_users';
import { login } from './handlers/login';
import { getMe } from './handlers/get_me';
import { requireAuth, requireManagerOrAbove } from './handlers/auth_middleware';
import { seedTestData } from './handlers/seed_test_data';
import { getStockTransferDetails } from './handlers/get_stock_transfer_details';
import { cancelStockTransfer } from './handlers/cancel_stock_transfer';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  getMe: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ input }) => getMe(input.token)),
  
  seedTestData: publicProcedure
    .mutation(() => seedTestData()),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Warehouse management
  createWarehouse: publicProcedure
    .input(createWarehouseInputSchema)
    .mutation(({ input }) => createWarehouse(input)),
  
  getWarehouses: publicProcedure
    .query(() => getWarehouses()),

  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),
  
  deleteProduct: publicProcedure
    .input(deleteProductInputSchema)
    .mutation(({ input }) => deleteProduct(input)),
  
  getProducts: publicProcedure
    .input(getProductsInputSchema)
    .query(({ input }) => getProducts(input)),

  // Inventory management
  updateInventory: publicProcedure
    .input(updateInventoryInputSchema)
    .mutation(({ input }) => updateInventory(input)),
  
  getInventory: publicProcedure
    .input(z.object({ warehouseId: z.number().optional() }))
    .query(({ input }) => getInventory(input.warehouseId)),

  // Sales management
  createSale: publicProcedure
    .input(createSaleInputSchema.extend({ cashierId: z.number().optional() }))
    .mutation(({ input }) => createSale(input, input.cashierId)),
  
  getSales: publicProcedure
    .input(z.object({
      warehouseId: z.number().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional()
    }))
    .query(({ input }) => getSales(input.warehouseId, input.startDate, input.endDate)),

  // Stock transfer management
  createStockTransfer: publicProcedure
    .input(createStockTransferInputSchema.extend({ requestedBy: z.number() }))
    .mutation(({ input }) => createStockTransfer(input, input.requestedBy)),
  
  getStockTransfers: publicProcedure
    .input(z.object({ 
      status: z.string().optional(),
      include_cancelled: z.boolean().optional().default(false)
    }))
    .query(({ input }) => getStockTransfers(input.status, input.include_cancelled)),

  getStockTransferDetails: publicProcedure
    .input(getStockTransferDetailsInputSchema)
    .query(({ input }) => getStockTransferDetails(input)),

  cancelStockTransfer: publicProcedure
    .input(cancelStockTransferInputSchema)
    .mutation(({ input }) => cancelStockTransfer(input)),

  // Packing management
  getPackingList: publicProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(({ input }) => getPackingList(input.status)),

  // Account management
  getAccountTransactions: publicProcedure
    .input(z.object({
      type: z.enum(['RECEIVABLE', 'PAYABLE']).optional(),
      status: z.string().optional()
    }))
    .query(({ input }) => getAccountTransactions(input.type, input.status)),

  // Reports
  generateSalesReport: publicProcedure
    .input(salesReportInputSchema)
    .query(({ input }) => generateSalesReport(input)),
  
  generateProfitReport: publicProcedure
    .input(profitReportInputSchema)
    .query(({ input }) => generateProfitReport(input)),

  // Dashboard
  getDashboardSummary: publicProcedure
    .input(z.object({ token: z.string().optional() }).optional())
    .query(({ input }) => getDashboardSummary(input?.token)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`POS & Inventory Management TRPC server listening at port: ${port}`);
}

start();

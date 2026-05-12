// ===== USER & AUTH =====
export type UserRole = 'admin' | 'manager' | 'staff' | 'readonly';

export interface User {
  id: string;
  username: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  warehouseAccess: string[]; // WH codes they can access, [] = all
  active: boolean;
  createdAt: string;
}

// ===== WAREHOUSE & BIN =====
export interface Warehouse {
  code: string;       // e.g. "WH1"
  name: string;       // e.g. "คลังหลัก"
  description?: string;
  active: boolean;
}

export interface BinLocation {
  id: string;
  warehouseCode: string;
  zone: string;       // e.g. "A", "B"
  binCode: string;    // e.g. "A1", "ALA-1-1", "TA-B-1-001"
  description?: string;
  capacity?: number;
  type?: 'normal' | 'cold' | 'quarantine' | 'reject' | 'loading';
  active: boolean;
}

// ===== ITEM / PRODUCT =====
export interface Item {
  id: string;
  code: string;         // Item code (SAP)
  name: string;
  description?: string;
  unit: string;         // UOM
  category?: string;
  vendorCode?: string;
  active: boolean;
  createdAt: string;
}

// ===== BATCH =====
export interface Batch {
  id: string;
  batchNumber: string;
  itemCode: string;
  itemName: string;
  expiryDate?: string;
  manufacturingDate?: string;
  quantity: number;       // current quantity
  warehouseCode: string;
  binCode: string;
  status: 'active' | 'expired' | 'quarantine' | 'consumed';
  createdAt: string;
  updatedAt: string;
}

// ===== STOCK =====
export interface StockEntry {
  id: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  warehouseCode: string;
  binCode: string;
  quantity: number;
  unit: string;
  updatedAt: string;
}

// ===== GOODS RECEIPT PO (GRPO) =====
export interface GRPOLine {
  lineNum: number;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturingDate?: string;
  warehouseCode: string;
  binCode?: string;
  unitPrice?: number;
}

export interface GRPO {
  id: string;
  docNumber: string;      // e.g. GRPO-2025-0001
  poNumber: string;       // PO number from SAP/supplier
  vendorCode: string;
  vendorName: string;
  docDate: string;
  postingDate: string;
  remark?: string;
  lines: GRPOLine[];
  status: 'draft' | 'confirmed' | 'putaway_pending' | 'completed';
  createdBy: string;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ===== GOODS RECEIPT (GR) =====
export interface GRLine {
  lineNum: number;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturingDate?: string;
  warehouseCode: string;
  binCode?: string;
  reason?: string;
}

export interface GoodsReceipt {
  id: string;
  docNumber: string;      // e.g. GR-2025-0001
  docDate: string;
  postingDate: string;
  type: 'general' | 'return' | 'adjustment';
  remark?: string;
  lines: GRLine[];
  status: 'draft' | 'confirmed' | 'putaway_pending' | 'completed';
  createdBy: string;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ===== GOODS ISSUE (GI) =====
export interface GILine {
  lineNum: number;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  batchNumber: string;
  warehouseCode: string;
  binCode: string;
  costCenter?: string;
  reason?: string;
}

export interface GoodsIssue {
  id: string;
  docNumber: string;      // e.g. GI-2025-0001
  docDate: string;
  postingDate: string;
  type: 'normal' | 'sample' | 'destroy' | 'transfer';
  requestedBy?: string;
  remark?: string;
  lines: GILine[];
  pickListId?: string;
  status: 'draft' | 'pick_pending' | 'picked' | 'confirmed' | 'completed';
  createdBy: string;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

// ===== PUTAWAY =====
export interface PutawayLine {
  lineNum: number;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  qty: number;
  unit: string;
  suggestedBin?: string;
  actualBin: string;
  warehouseCode: string;
  status: 'pending' | 'completed';
  completedAt?: string;
}

export interface PutawayTask {
  id: string;
  docNumber: string;      // e.g. PUT-2025-0001
  sourceType: 'GRPO' | 'GR';
  sourceDocNumber: string;
  docDate: string;
  lines: PutawayLine[];
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// ===== PICK LIST =====
export interface PickListLine {
  lineNum: number;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  requiredQty: number;
  pickedQty: number;
  unit: string;
  warehouseCode: string;
  binCode: string;
  status: 'pending' | 'partial' | 'picked';
  pickedAt?: string;
  pickedBy?: string;
}

export interface PickList {
  id: string;
  docNumber: string;      // e.g. PL-2025-0001
  giDocNumber: string;
  docDate: string;
  lines: PickListLine[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// ===== BATCH TRANSACTION (for report) =====
export type TransactionType = 'GRPO' | 'GR' | 'GI' | 'PUTAWAY' | 'ADJUSTMENT';

export interface BatchTransaction {
  id: string;
  transactionType: TransactionType;
  docNumber: string;
  docDate: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  expiryDate?: string;
  warehouseCode: string;
  binCode: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  createdBy: string;
  createdAt: string;
  remark?: string;
}

// ===== PAGINATION =====
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== DASHBOARD STATS =====
export interface DashboardStats {
  totalItems: number;
  totalBatches: number;
  pendingGRPO: number;
  pendingGR: number;
  pendingGI: number;
  pendingPutaway: number;
  pendingPickList: number;
  recentTransactions: BatchTransaction[];
  expiringBatches: Batch[];
}

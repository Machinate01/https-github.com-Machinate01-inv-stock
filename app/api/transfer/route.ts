import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, getNextDocNumber } from '@/lib/data/db';
import { StockEntry, BatchTransaction, TransferLocation, TransferLine } from '@/lib/types';
import { getSession } from '@/lib/utils/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const transfers = await readJson<TransferLocation>('transfers.json');
  return NextResponse.json(transfers.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { docDate, remark, lines } = body as {
    docDate: string;
    remark?: string;
    lines: Omit<TransferLine, 'lineNum'>[];
  };

  if (!lines || lines.length === 0)
    return NextResponse.json({ error: 'ไม่มีรายการ' }, { status: 400 });

  const now = new Date().toISOString();
  const stock = await readJson<StockEntry>('stock.json');
  const txns = await readJson<BatchTransaction>('batch_transactions.json');

  // Validate all lines first
  for (const line of lines) {
    const src = stock.find(
      s => s.itemCode === line.itemCode &&
        s.batchNumber === line.batchNumber &&
        s.warehouseCode === line.fromWarehouseCode &&
        s.binCode === line.fromBinCode
    );
    if (!src)
      return NextResponse.json({ error: `ไม่พบ Stock: ${line.itemCode} Batch ${line.batchNumber} ที่ ${line.fromBinCode}` }, { status: 400 });
    if (src.quantity < line.qty)
      return NextResponse.json({ error: `Stock ไม่พอ: ${line.itemCode} มี ${src.quantity} ${src.unit} แต่โอน ${line.qty}` }, { status: 400 });
  }

  // Process each line
  const processedLines: TransferLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Deduct from source
    const srcIdx = stock.findIndex(
      s => s.itemCode === line.itemCode &&
        s.batchNumber === line.batchNumber &&
        s.warehouseCode === line.fromWarehouseCode &&
        s.binCode === line.fromBinCode
    );
    stock[srcIdx].quantity -= line.qty;
    stock[srcIdx].updatedAt = now;

    // 2. Add to destination (merge if exists)
    const dstIdx = stock.findIndex(
      s => s.itemCode === line.itemCode &&
        s.batchNumber === line.batchNumber &&
        s.warehouseCode === line.toWarehouseCode &&
        s.binCode === line.toBinCode
    );
    if (dstIdx >= 0) {
      stock[dstIdx].quantity += line.qty;
      stock[dstIdx].updatedAt = now;
    } else {
      stock.push({
        id: uuidv4(),
        itemCode: line.itemCode,
        itemName: line.itemName,
        batchNumber: line.batchNumber,
        warehouseCode: line.toWarehouseCode,
        binCode: line.toBinCode,
        quantity: line.qty,
        unit: line.unit,
        updatedAt: now,
      });
    }

    // 3. Batch transaction — OUT from source
    const prevTxns = txns.filter(t => t.itemCode === line.itemCode && t.batchNumber === line.batchNumber);
    const balanceBefore = prevTxns.length > 0 ? prevTxns[prevTxns.length - 1].balanceQty : stock[srcIdx].quantity + line.qty;

    txns.push({
      id: uuidv4(),
      transactionType: 'TRANSFER',
      docNumber: '', // will fill after
      docDate,
      itemCode: line.itemCode,
      itemName: line.itemName,
      batchNumber: line.batchNumber,
      warehouseCode: line.fromWarehouseCode,
      binCode: line.fromBinCode,
      qtyIn: 0,
      qtyOut: line.qty,
      balanceQty: balanceBefore - line.qty,
      createdBy: session.username,
      createdAt: now,
      remark: `โอนไป ${line.toWarehouseCode}/${line.toBinCode}`,
    });

    // 4. Batch transaction — IN to destination
    const balanceAfter = balanceBefore - line.qty + line.qty;
    txns.push({
      id: uuidv4(),
      transactionType: 'TRANSFER',
      docNumber: '',
      docDate,
      itemCode: line.itemCode,
      itemName: line.itemName,
      batchNumber: line.batchNumber,
      warehouseCode: line.toWarehouseCode,
      binCode: line.toBinCode,
      qtyIn: line.qty,
      qtyOut: 0,
      balanceQty: balanceAfter,
      createdBy: session.username,
      createdAt: now,
      remark: `โอนมาจาก ${line.fromWarehouseCode}/${line.fromBinCode}`,
    });

    processedLines.push({ ...line, lineNum: i + 1 });
  }

  // Generate doc number
  const docNumber = await getNextDocNumber('TRF');

  // Patch doc number into transactions
  for (let i = txns.length - lines.length * 2; i < txns.length; i++) {
    txns[i].docNumber = docNumber;
  }

  // Save transfer document
  const transfers = await readJson<TransferLocation>('transfers.json');
  const transfer: TransferLocation = {
    id: uuidv4(),
    docNumber,
    docDate,
    remark,
    lines: processedLines,
    status: 'confirmed',
    createdBy: session.username,
    createdAt: now,
  };
  transfers.push(transfer);

  await Promise.all([
    writeJson('stock.json', stock),
    writeJson('batch_transactions.json', txns),
    writeJson('transfers.json', transfers),
  ]);

  return NextResponse.json(transfer, { status: 201 });
}

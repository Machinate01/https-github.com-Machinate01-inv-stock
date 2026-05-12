import { BinLocation } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ===================================================
// WH1 - คลังหลัก (Storage Room - Floor 1)
// ===================================================
function generateWH1Bins(): BinLocation[] {
  const bins: BinLocation[] = [];

  // Zone A: A1-A12
  for (let i = 1; i <= 12; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'A', binCode: `A${i}`, type: 'normal', active: true });
  }
  // Zone B: B1-B12
  for (let i = 1; i <= 12; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'B', binCode: `B${i}`, type: 'normal', active: true });
  }
  // Zone C: C1-C9
  for (let i = 1; i <= 9; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'C', binCode: `C${i}`, type: 'normal', active: true });
  }
  // Zone D: D1-D10
  for (let i = 1; i <= 10; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'D', binCode: `D${i}`, type: 'normal', active: true });
  }
  // Zone E: E1-E4
  for (let i = 1; i <= 4; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'E', binCode: `E${i}`, type: 'normal', active: true });
  }
  // Zone R: Verification Area R1-R6
  for (let i = 1; i <= 6; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'R', binCode: `R${i}`, description: 'Verification Area', type: 'normal', active: true });
  }
  // Zone P: Prepare for Delivery P1-P6
  for (let i = 1; i <= 6; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'P', binCode: `P${i}`, description: 'Prepare for Delivery', type: 'normal', active: true });
  }
  // ATS Area: A64, A65, A66
  ['A64', 'A65', 'A66'].forEach(code => {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'ATS', binCode: code, description: 'ATS Area', type: 'cold', active: true });
  });
  // Cold Room CR-1
  bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'CR', binCode: 'CR-1', description: 'Cold Room', type: 'cold', active: true });
  // Loading Area
  bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'L', binCode: 'L-LOADING', description: 'Loading Area', type: 'loading', active: true });

  return bins;
}

// ===================================================
// WH1 - Mezzanine Floor
// ===================================================
function generateWH1MezzanineBins(): BinLocation[] {
  const bins: BinLocation[] = [];
  // Zone A2: A2-1 to A2-16
  for (let i = 1; i <= 16; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'A2', binCode: `A2-${i}`, description: 'Mezzanine Zone A', type: 'normal', active: true });
  }
  // Zone B2: B2-1 to B2-10
  for (let i = 1; i <= 10; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'B2', binCode: `B2-${i}`, description: 'Mezzanine Zone B', type: 'normal', active: true });
  }
  // Zone C2: C2-1 to C2-10
  for (let i = 1; i <= 10; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'C2', binCode: `C2-${i}`, description: 'Mezzanine Zone C', type: 'normal', active: true });
  }
  // Zone G2: G2-1 to G2-9
  for (let i = 1; i <= 9; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'G2', binCode: `G2-${i}`, description: 'Mezzanine Zone G', type: 'normal', active: true });
  }
  // Cold Spot
  bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'COLD', binCode: 'COLD-SPOT-M', description: 'Mezzanine Cold Spot', type: 'cold', active: true });
  return bins;
}

// ===================================================
// WH1 - Floor 5 (WareHouse Floor 5)
// ===================================================
function generateWH1Floor5Bins(): BinLocation[] {
  const bins: BinLocation[] = [];
  const zones = ['A', 'B', 'C', 'D', 'E', 'F'];
  // Each zone has positions 1-10, levels 1-2
  zones.forEach(zone => {
    for (let pos = 1; pos <= 10; pos++) {
      for (let lv = 1; lv <= 2; lv++) {
        bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: `F5-${zone}`, binCode: `${zone}-${pos}-${lv}`, description: `Floor5 Zone${zone}`, type: 'normal', active: true });
      }
    }
  });
  // Zone G: Torrent,Kusum,Incepta (4 Pallet) G-10, G-11
  for (let i = 10; i <= 11; i++) {
    for (let lv = 1; lv <= 2; lv++) {
      bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'F5-G', binCode: `G-${i}-${lv}`, description: 'Floor5 Zone G', type: 'normal', active: true });
    }
  }
  // Zone H: Enwei/Dragon H1-H3 levels 1-2
  for (let i = 1; i <= 3; i++) {
    for (let lv = 1; lv <= 2; lv++) {
      bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'F5-H', binCode: `H-${i}-${lv}`, description: 'Floor5 Zone H - Enwei/Dragon', type: 'normal', active: true });
    }
  }
  // Dynamic Zone A (Medical Devices) A1-A18
  for (let i = 1; i <= 18; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'F5-DYN-A', binCode: `DYN-A${i}`, description: 'Floor5 Dynamic Zone A', type: 'normal', active: true });
  }
  // Dynamesh/Dipromed B1-B8
  for (let i = 1; i <= 8; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'F5-DYN-B', binCode: `DYN-B${i}`, description: 'Floor5 Dynamesh Zone B', type: 'normal', active: true });
  }
  // Cold Spot
  bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'F5-COLD', binCode: 'F5-COLD-SPOT', description: 'Floor5 Cold Spot', type: 'cold', active: true });
  bins.push({ id: uuidv4(), warehouseCode: 'WH1', zone: 'F5-HOT', binCode: 'F5-HOT-SPOT', description: 'Floor5 Hot Spot', type: 'normal', active: true });
  return bins;
}

// ===================================================
// WH2 - คลังรอง (Rack System AL-*)
// ===================================================
function generateWH2Bins(): BinLocation[] {
  const bins: BinLocation[] = [];
  const zones = ['A','B','C','D','E','F','G','H','I','J','K'];
  zones.forEach(zone => {
    for (let row = 1; row <= 2; row++) {
      for (let col = 1; col <= 12; col++) {
        bins.push({
          id: uuidv4(),
          warehouseCode: 'WH2',
          zone: `AL${zone}`,
          binCode: `AL${zone}-${row}-${col}`,
          description: `WH2 Zone ${zone} Row${row} Col${col}`,
          type: 'normal',
          active: true
        });
      }
    }
  });
  // Zone L (ALM) Row1-2, Col1-5
  for (let row = 1; row <= 2; row++) {
    for (let col = 1; col <= 5; col++) {
      bins.push({ id: uuidv4(), warehouseCode: 'WH2', zone: 'ALM', binCode: `ALM-${row}-${col}`, type: 'normal', active: true });
    }
  }
  // Quarantine RF1-RF3
  ['RF1','RF2','RF3'].forEach(rf => {
    bins.push({ id: uuidv4(), warehouseCode: 'WH2', zone: 'QA', binCode: rf, description: 'Quarantine Area', type: 'quarantine', active: true });
  });
  // Cold Spot
  bins.push({ id: uuidv4(), warehouseCode: 'WH2', zone: 'COLD', binCode: 'WH2-COLD-SPOT', description: 'WH2 Cold Spot', type: 'cold', active: true });
  // Medical Device Storage N1-N6
  for (let i = 1; i <= 6; i++) {
    bins.push({ id: uuidv4(), warehouseCode: 'WH2', zone: 'MED', binCode: `N${i}`, description: 'Medical Device Storage', type: 'normal', active: true });
  }
  return bins;
}

// ===================================================
// WH2-1 TA Room
// ===================================================
function generateWH21TABins(): BinLocation[] {
  const bins: BinLocation[] = [];
  const zones = ['B','C','D','E','F','G','H','I','J','K','L'];
  zones.forEach(zone => {
    const maxRow = ['G','I','J'].includes(zone) ? 3 : 2;
    for (let row = 1; row <= maxRow; row++) {
      for (let col = 1; col <= 24; col++) {
        const colStr = String(col).padStart(3, '0');
        bins.push({
          id: uuidv4(),
          warehouseCode: 'WH2-1',
          zone: `TA-${zone}`,
          binCode: `TA-${zone}-${row}-${colStr}`,
          description: `TA Room Zone${zone}`,
          type: 'normal',
          active: true
        });
      }
    }
  });
  // Zone A (small) TA-A-2-01 to TA-A-1-07
  for (let i = 1; i <= 7; i++) {
    const colStr = String(i).padStart(2, '0');
    bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TA-A', binCode: `TA-A-1-${colStr}`, type: 'normal', active: true });
    bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TA-A', binCode: `TA-A-2-${colStr}`, type: 'normal', active: true });
  }
  // Quarantine Area
  bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TA-QA', binCode: 'TA-QUARANTINE', description: 'TA Quarantine Area', type: 'quarantine', active: true });
  // Cold Spot Bottom
  bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TA-COLD', binCode: 'TA-COLD-SPOT', description: 'TA Cold Spot', type: 'cold', active: true });
  return bins;
}

// ===================================================
// WH2-1 TB Room
// ===================================================
function generateWH21TBBins(): BinLocation[] {
  const bins: BinLocation[] = [];
  const zones = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  zones.forEach(zone => {
    const maxRow = ['G','J'].includes(zone) ? 3 : ['C','D','E'].includes(zone) ? 5 : 2;
    const maxCol = 26;
    for (let row = 1; row <= maxRow; row++) {
      for (let col = 1; col <= maxCol; col++) {
        const colStr = String(col).padStart(3, '0');
        bins.push({
          id: uuidv4(),
          warehouseCode: 'WH2-1',
          zone: `TB-${zone}`,
          binCode: `TB-${zone}-${row}-${colStr}`,
          description: `TB Room Zone${zone}`,
          type: 'normal',
          active: true
        });
      }
    }
  });
  // Cold Spot Bottom & Middle
  bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TB-COLD', binCode: 'TB-COLD-SPOT-BOTTOM', description: 'TB Cold Spot Bottom', type: 'cold', active: true });
  bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TB-COLD', binCode: 'TB-COLD-SPOT-MIDDLE', description: 'TB Cold Spot Middle', type: 'cold', active: true });
  bins.push({ id: uuidv4(), warehouseCode: 'WH2-1', zone: 'TB-HOT', binCode: 'TB-HOT-SPOT', description: 'TB Hot Spot', type: 'normal', active: true });
  return bins;
}

// ===================================================
// Simple bins for other warehouses
// ===================================================
function generateSimpleBins(warehouseCode: string, prefix: string, count: number, type: BinLocation['type'] = 'normal'): BinLocation[] {
  const bins: BinLocation[] = [];
  for (let i = 1; i <= count; i++) {
    bins.push({
      id: uuidv4(),
      warehouseCode,
      zone: prefix,
      binCode: `${prefix}-${String(i).padStart(2, '0')}`,
      type,
      active: true
    });
  }
  return bins;
}

export function generateAllBins(): BinLocation[] {
  return [
    ...generateWH1Bins(),
    ...generateWH1MezzanineBins(),
    ...generateWH1Floor5Bins(),
    ...generateWH2Bins(),
    ...generateWH21TABins(),
    ...generateWH21TBBins(),
    // WH1-1 (Staging)
    ...generateSimpleBins('WH1-1', 'STG', 20),
    // WH2-THPD
    ...generateSimpleBins('WH2-THPD', 'THPD', 10),
    // WH3 Destruction
    ...generateSimpleBins('WH3', 'DST', 5, 'reject'),
    // WH4 Sample
    ...generateSimpleBins('WH4', 'SPL', 10),
    // WH5 Lending
    ...generateSimpleBins('WH5', 'LND', 10),
    // WH6 Credit Note
    ...generateSimpleBins('WH6', 'CRD', 10),
    // WH7 Glacier
    ...generateSimpleBins('WH7', 'GLC', 10, 'cold'),
    // WH8 Consignment
    ...generateSimpleBins('WH8', 'CSG', 10),
    // WH09 Pending Delivery
    ...generateSimpleBins('WH09', 'PDD', 10),
    // WH10 Cancelled
    ...generateSimpleBins('WH10', 'CNC', 5),
    // WH12 Claim
    ...generateSimpleBins('WH12', 'CLM', 10, 'quarantine'),
    // WH13 Quarantine
    ...generateSimpleBins('WH13', 'QUA', 15, 'quarantine'),
    // WH99 Adjustment
    ...generateSimpleBins('WH99', 'ADJ', 5),
  ];
}

import Papa from 'papaparse';

// Expected CSV columns:
// medicineName, brandNames, saltComposition, category, quantity, price, unit, lowStockThreshold
export const parseInventoryCSV = (csvString) => {
  const { data, errors } = Papa.parse(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });

  if (errors.length > 0) {
    throw new Error(`CSV parse error: ${errors[0].message}`);
  }

  const required = ['medicineName', 'quantity'];
  const rows = [];
  const rowErrors = [];

  data.forEach((row, i) => {
    const lineNum = i + 2; // account for header row

    // Check required fields
    const missing = required.filter((f) => !row[f]);
    if (missing.length > 0) {
      rowErrors.push(`Row ${lineNum}: missing ${missing.join(', ')}`);
      return;
    }

    // Validate quantity
    const quantity = Number(row.quantity);
    if (isNaN(quantity) || quantity < 0) {
      rowErrors.push(`Row ${lineNum}: quantity must be a non-negative number`);
      return;
    }

    rows.push({
      medicineName: row.medicineName,
      brandNames: row.brandNames
        ? row.brandNames.split('|').map((b) => b.trim()).filter(Boolean)
        : [],
      saltComposition: row.saltComposition || '',
      category: row.category || 'other',
      quantity,
      price: row.price ? Number(row.price) : undefined,
      unit: row.unit || 'strip',
      lowStockThreshold: row.lowStockThreshold ? Number(row.lowStockThreshold) : 10,
    });
  });

  return { rows, rowErrors };
};
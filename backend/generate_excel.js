const XLSX = require('xlsx');
const path = require('path');

const data = [
    {
        "Referencia": "REF-TEST-001",
        "Nombre": "Producto Test 1",
        "Equipo": "Equipo A",
        "Existencia": 10,
        "Tipo": "Herramienta",
        "Costo": 150.50
    },
    {
        "Referencia": "REF-TEST-002",
        "Nombre": "Producto Test 2",
        "Equipo": "Equipo B",
        "Existencia": 5,
        "Tipo": "Insumo",
        "Costo": 50.00
    },
    {
        "Referencia": "REF-TEST-001", // Duplicate reference to test upsert
        "Nombre": "Producto Test 1 Updated",
        "Equipo": "Equipo A Updated",
        "Existencia": 20,
        "Tipo": "Herramienta",
        "Costo": 160.00
    }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "Inventario");

const filePath = path.join(__dirname, 'test_import.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Test Excel file created at: ${filePath}`);

const fs = require('fs');
const csv = require('csv-parser'); // Run 'npm install csv-parser'
const parameters = require('./parameters.json');
const { ActuarialEngine } = require('./engine.js');

const testResults = [];

fs.createReadStream('test_cases.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Map CSV columns to Engine Inputs
    const inputs = {
      Case_Life_1_Current_age: parseInt(row['Current Age']),
      Case_Life_1_Gross_salary: parseFloat(row['Gross Salary'].replace(/,/g, '')),
      Case_Joint_Savings_initial_value: parseFloat(row['Savings'].replace(/,/g, '')),
      Case_Joint_House_price: parseFloat(row['House Price'].replace(/,/g, '')),
      // ... map all other necessary columns
      Returns_pension: 2.0,
      Returns_cash: -0.5,
      Returns_inflation: 2.5
    };

    const engine = new ActuarialEngine(inputs, parameters);
    const result = engine.runFullProjection();

    // Verification Logic
    const expectedPurchaseAge = parseInt(row['Results: Purchase Age']);
    const diff = result.purchaseAge - expectedPurchaseAge;

    console.log(`Test Case ${row['ID']}: Purchase Age Diff: ${diff === 0 ? 'MATCH' : 'FAIL (' + diff + ')'}`);
    
    if (diff !== 0) {
        console.error(`Row ID ${row['ID']} failed. Code: ${result.purchaseAge} vs Sheet: ${expectedPurchaseAge}`);
    }
  });
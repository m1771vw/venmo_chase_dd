// Import the library
if(typeof require !== 'undefined') XLSX = require('xlsx');
// Load the workbook
let workbook = XLSX.readFile('Chase4589_Activity20210220_20210305_20210305.xlsx');
let sheetName = workbook.SheetNames[0]
let worksheet = workbook.Sheets[sheetName];
let sheets = workbook.Sheets[sheetName]
let sheetJson = XLSX.utils.sheet_to_json(worksheet).map( x => ({ Description: x.Description, Amount: x.Amount })  )
// console.log(sheetJson);

let venmoworkbook = XLSX.readFile('venmo_statement0501_0521.csv');
let venmosheetName = venmoworkbook.SheetNames[0]
let venmoworksheet = venmoworkbook.Sheets[venmosheetName];
let venmosheets = venmoworkbook.Sheets[venmosheetName]
// console.log(XLSX.utils.sheet_to_json(venmoworksheet));

let venmosheetJson = XLSX.utils.sheet_to_json(venmoworksheet).map( x => ({ Description: x.__EMPTY_4, Amount: x.__EMPTY_7 })  )
// console.log(venmosheetJson)
let venmosheetJsonHasNumber = venmosheetJson.filter(x => typeof x.Description === 'number' || typeof x.Amount === 'number')
// console.log(venmosheetJsonHasNumber)

venmosheetJson = venmosheetJson.filter(x => ((x.Description !== undefined && x.Amount !== undefined) && 
                                            (x.Description !== 'Note' && x.Amount !== 'Amount (total)') && 
                                           (typeof x.Description === 'string' && typeof x.Amount === 'string'))
                                      )
console.log(venmosheetJson)

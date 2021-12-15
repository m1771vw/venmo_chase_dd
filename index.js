// Import the library
if (typeof require !== 'undefined') XLSX = require('xlsx')
fs = require('fs')
require('dotenv').config()

const { MONTH, CHASE_WORKSHEET, VENMO_WORKSHEET } = process.env;

const reporting = require('./Reporting')
const importSheet = (filename, descriptionColumn, amountColumn) => {
  // Load the workbook
  // TODO: - app config
  let workbook = XLSX.readFile(filename) // load the actual workbook
  let sheetName = workbook.SheetNames[0] // get the name of the first sheet
  let worksheet = workbook.Sheets[sheetName] // get the actual sheet
  // Return JSON version of the sheet
  return XLSX.utils
    .sheet_to_json(worksheet)
    .map((x) => ({ Description: x[descriptionColumn], Amount: x[amountColumn] }))
}

const filterUnwantedVenmoData = (venmoSheetJson) => {
  // Reduce VenmoSheet and take out the ones I don't want
  return venmoSheetJson.filter(
    (x) =>
      x.Description !== undefined &&
      x.Amount !== undefined &&
      x.Description !== 'Note' &&
      x.Amount !== 'Amount (total)' &&
      typeof x.Description === 'string' &&
      typeof x.Amount === 'string' 
      // NOTE: Sometimes is a string ('+28.04'), sometimes is a number? This is to remove all the weird numbers (23590)
      // UPDATE NOTE: It will be number on winOS, string on mac
      // UPDATE NOTE: I think it depends on the month tbh, need to .env this
  )
}

const main = () => {
  console.log('Starting Program...')
  let month = MONTH
  let chaseSheetName = `statements/${month}/${CHASE_WORKSHEET}.csv`
  let venmoSheetName = `statements/${month}/${VENMO_WORKSHEET}.csv`
  let chaseSheetJson = importSheet(chaseSheetName, 'Description', 'Amount')
  let doordashSheetJson = chaseSheetJson.filter((x) => x.Description.includes('DOORDASH'))
  let venmoSheetJson = importSheet(venmoSheetName, '__EMPTY_4', '__EMPTY_7')
  venmoSheetJson = filterUnwantedVenmoData(venmoSheetJson)
  // Find the matches
  let { foundCharges, missingCharges } = reporting.findMatches(doordashSheetJson, venmoSheetJson)
  
  reporting.printTextFile(`${month}/Found Charges.txt`, foundCharges)
  reporting.printTextFile(`${month}/Missing Charges.txt`, missingCharges)
  reporting.printTextFile(`${month}/DoorDash Total.txt`, reporting.generateSinglePlaceReport(chaseSheetJson, `DOORDASH`))
  reporting.printTextFile(`${month}/Prices Over 25.txt`, reporting.findPricesOverAmount(chaseSheetJson, 25))
  reporting.generateVenmoReport(venmoSheetName, `${month}`)
  reporting.generateCategoryReport(chaseSheetName, `${month}/Chase Report.txt`)
  reporting.generateSingleCategoryReport(chaseSheetName,`${month}/Gas`)
  reporting.generateSingleCategoryReport(chaseSheetName,`${month}/Entertainment`)
}

main()

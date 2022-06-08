// Import the library
if (typeof require !== 'undefined') XLSX = require('xlsx')
fs = require('fs')
require('dotenv').config()
const reporting = require('./Reporting')

const { MONTH, CHASE_WORKSHEET, VENMO_WORKSHEET } = process.env

/**
 *
 * @param {string} filename
 * @param {string} descriptionColumn
 * @param {string} amountColumn
 * @returns
 */
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
/**
 * Take out the properties from the Venmo report we don't want
 * @param {array} venmoSheetJson
 * @returns
 */
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
  let chaseSheetName = `statements/${MONTH}/${CHASE_WORKSHEET}.csv`
  let venmoSheetName = `statements/${MONTH}/${VENMO_WORKSHEET}.csv`
  let chaseSheetJson = importSheet(chaseSheetName, 'Description', 'Amount')
  let doordashSheetJson = chaseSheetJson.filter((x) => x.Description.includes('DOORDASH'))
  let venmoSheetJson = importSheet(venmoSheetName, '__EMPTY_4', '__EMPTY_7')
  venmoSheetJson = filterUnwantedVenmoData(venmoSheetJson)
  // Find the matches
  let { foundCharges, missingCharges } = reporting.findMatches(doordashSheetJson, venmoSheetJson)

  reporting.printTextFile(`Found Charges.txt`, foundCharges)
  reporting.printTextFile(`Missing Charges.txt`, missingCharges)
  reporting.printTextFile(`DoorDash Total.txt`, reporting.generateSinglePlaceReport(chaseSheetJson, `DOORDASH`))
  reporting.printTextFile(`Prices Over 25.txt`, reporting.findPricesOverAmount(chaseSheetJson, 25))
  reporting.generateVenmoReport(venmoSheetName, `Venmo Report.txt`)
  reporting.generateCategoryReport(chaseSheetName, `Chase Report.txt`)
  reporting.generateSingleCategoryReport(chaseSheetName, `Gas`)
  reporting.generateSingleCategoryReport(chaseSheetName, `Entertainment`)
}

main()

// Import the library
if (typeof require !== 'undefined') XLSX = require('xlsx')
fs = require('fs')
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
  venmoSheetJson.filter(x => x.Description !== undefined)
  return venmoSheetJson.filter(
    (x) =>
      x.Description !== undefined &&
      x.Amount !== undefined &&
      x.Description !== 'Note' &&
      x.Amount !== 'Amount (total)' &&
      typeof x.Description === 'string' &&
      typeof x.Amount === 'string' // NOTE: Sometimes is a string ('+28.04'), sometimes is a number? This is to remove all the weird numbers (23590)
  )
}

const main = () => {
  console.log('Starting Program...')
  let chaseSheetJson = importSheet('statements/08/Chase4589.csv', 'Description', 'Amount')
  let doordashSheetJson = chaseSheetJson.filter((x) => x.Description.includes('DOORDASH'))
  let venmoSheetJson = importSheet('statements/08/venmo.csv', '__EMPTY_4', '__EMPTY_7')
  venmoSheetJson = filterUnwantedVenmoData(venmoSheetJson)
  // Find the matches
  let { foundCharges, missingCharges } = reporting.findMatches(doordashSheetJson, venmoSheetJson)
  // Print Matches
  // foundCharges.forEach((charge, index) => {
  //   console.log('FOUND CHARGES: ', charge.Description, ' ', charge.Amount)
  // })
  // missingCharges.forEach((charge, index) => {
  //   console.log('NOT FOUND CHARGES: ', charge.Description, ' ', charge.Amount)
  // })
  // Find any duplicates
  // let duplicateDoordashPrices = reporting.findDuplicatePrices(doordashSheetJson)
  // let expensiveDoordashPrices = reporting.findPricesOverAmount(doordashSheetJson, 20)
  let singlePlacePrices = reporting.generateSinglePlaceReport(chaseSheetJson, 'COSTCO')
  // console.log(singlePlacePrices)
  reporting.printTextFile('foundCharges.txt', foundCharges)
  reporting.printTextFile('missingCharges.txt', missingCharges)
  // reporting.printTextFile('singePlacePrices.txt', singlePlacePrices)
  reporting.printTextFile('doordashTotal.txt', reporting.generateSinglePlaceReport(chaseSheetJson, 'DOORDASH'))
  reporting.printTextFile('olibolitotal.txt', reporting.generateSinglePlaceReport(chaseSheetJson, 'OLIBOLI'))
  reporting.printTextFile('pricesOver50.txt', reporting.findPricesOverAmount(chaseSheetJson, 50))


  // let duplicateVenmoPrices = reporting.findDuplicatePrices(venmoSheetJson)
}
main()

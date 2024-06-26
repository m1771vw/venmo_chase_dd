// Import the library
if (typeof require !== 'undefined') XLSX = require('xlsx')
fs = require('fs')
require('dotenv').config()
const { MONTH } = process.env
const { convertVenmoStringToFloat, calculateAmount } = require('./Helper')

const findMatches = (doordashSheetJson, venmosheetJson) => {
	console.log('Trying to find matches.....')
	let foundCharges = []
	let missingCharges = []
	doordashSheetJson.forEach((charge, index) => {
		// Remove negative signs from chase side
		if (charge.Description.toString() === 'DD DOORDASH THAIWAVE') {
			console.log('Charge Found')
		}
		let formattedCharge = charge.Amount.toString().replace('-', '')
		// Keep track of whether we found something or not
		let chargeFound = false
		// ex: 12.1 found -> 12.10 for consistency
		if (formattedCharge[formattedCharge.length - 2] === '.') {
			formattedCharge = formattedCharge + '0'
		}
		venmosheetJson.forEach((x) => {
			// if data comes in like + $, remove this. Might not appear in newer venmo data
			// replace the .00 because Chase is bringing it in as no .00
			let formattedAmount = x.Amount.toString().replace('+ $', '').replace('.00', '')
			if (formattedAmount === formattedCharge) {
				foundCharges.push(charge)
				chargeFound = true
			}
		})
		if (chargeFound === false) missingCharges.push(charge)
	})

	return {
		foundCharges,
		missingCharges,
	}
}

// Scan all the prices and see if there's a duplicate
const findDuplicatePrices = (workSheetJson) => {
	let duplicateAmounts = []
	let allAmountList = workSheetJson.map((x) => x.Amount)
	let amountFoundIndices = []
	workSheetJson.forEach((charge, index) => {
		for (let i = index + 1; i < allAmountList.length; i++) {
			if (charge.Amount === allAmountList[i]) {
				amountFoundIndices.push(index)
				amountFoundIndices.push(i)
			}
		}
	})
	amountFoundIndices.forEach((x) => duplicateAmounts.push(workSheetJson[x]))
	return duplicateAmounts
}

/**
 *
 * Provide a vendor to look for and it'll return a report
 * Ex: Give me all prices from Stater Bros
 * Return all prices and return total price
 * Also, use include not hard equal
 * Ex: WHOLEFDS JAM -> WHOLEFDS JAM 10201 & WHOLEFDS JAM LA
 * @param {object} workSheetJson
 * @param {string} storeName
 * @param {string} field
 */
const generateSinglePlaceReport = (workSheetJson, storeName, field = 'Description') => {
	// Filter by the storename on description
	let storesFound = workSheetJson.filter((x) => typeof x[field] === 'string' && x[field].includes(storeName))

	let totalSpent =
		storesFound.length > 0
			? storesFound.reduce((accumulator, currentValue) => ({
					Amount: accumulator.Amount + currentValue.Amount,
			  }))
			: []
	return { storesFound, totalSpent }
}
// Return all the items that are over the high price point
const findPricesOverAmount = (workSheetJson, findPrice) => {
	// TODO: - Need to make negative positive or vice versa
	let expensiveAmounts = []
	let allAmountList = workSheetJson.map((x) => Math.abs(x.Amount))
	let amountFoundIndices = []

	allAmountList.forEach((amount, index) => {
		if (amount >= findPrice) amountFoundIndices.push(index)
	})
	amountFoundIndices.forEach((x) => expensiveAmounts.push(workSheetJson[x]))

	return expensiveAmounts
}

// Remove brackets, curlies, replaces commands with new lines
const formatReport = (report) => {
	return report.replace(/\[/g, '').replace(/\]/g, '').replace(/\{/g, '').replace(/\}\,/g, '\n')
}

/**
 * Take in a report and print out the information into a text file
 * @param {string} outputFileName Name of outputted text file
 * @param {Array} report Array of objects that contain report information
 * @param {string} folderName Folder to use, defaulted to 'reports/'
 */
const printTextFile = (outputFileName, report, folderName = 'reports/') => {
	// let folderName = 'reports/'
	folderName += MONTH + '/'
	try {
		if (!fs.existsSync(folderName)) {
			fs.mkdirSync(folderName, { recursive: true })
		}
	} catch (err) {
		console.error(err)
	}
	fs.writeFile(folderName + outputFileName, formatReport(JSON.stringify(report)), (err) => {
		if (err) return console.log(err)
	})
}

/*
  Take each different category and generate a report for each of them
  Have the totals at the top and then the full thing at the bottom 

  This needs to return an array with everything
*/
const generateCategoryReport = (filename, reportFileName) => {
	let workbook = XLSX.readFile(filename) // load the actual workbook
	let sheetName = workbook.SheetNames[0] // get the name of the first sheet
	let worksheet = workbook.Sheets[sheetName] // get the actual sheet
	// Return JSON version of the sheet
	let filteredWorksheet = XLSX.utils.sheet_to_json(worksheet).map((x) => ({
		Description: x['Description'],
		Amount: x['Amount'],
		Category: x['Category'],
	}))
	filteredWorksheet = filteredWorksheet.sort((a, b) => {
		var x = a.Category
		var y = b.Category
		return x < y ? -1 : x > y ? 1 : 0
	})

	let categories = {}
	filteredWorksheet.forEach((x) => {
		if (categories.hasOwnProperty(x.Category)) categories[x.Category] = categories[x.Category] + x.Amount
		else categories[x.Category] = x.Amount
	})

	Object.keys(categories).forEach((x) => {
		filteredWorksheet.unshift({ [x]: categories[x] })
	})

	printTextFile(reportFileName, filteredWorksheet)
}

const generateVenmoReport = (filename, month) => {
	let workbook = XLSX.readFile(filename) // load the actual workbook
	let sheetName = workbook.SheetNames[0] // get the name of the first sheet
	let worksheet = workbook.Sheets[sheetName] // get the actual sheet
	// Return JSON version of the sheet
	let filteredWorksheet = XLSX.utils.sheet_to_json(worksheet).map((x) => ({
		Description: x['__EMPTY_4'],
		Amount: x['__EMPTY_7'],
		Type: x['__EMPTY_2'],
		From: x['__EMPTY_5'],
		To: x['__EMPTY_6'],
	}))
	// let filteredWorksheet2 = filteredWorksheet = filteredWorksheet.filter(
	// 	(x) =>
	// 		x.Description !== undefined &&
	// 		x.Amount !== undefined &&
	// 		x.Description !== 'Note' &&
	// 		x.Amount !== 'Amount (total)' &&
	// 		// typeof x.Description === 'string' &&
	// 		(typeof x.Amount === 'number' || typeof x.Amount === 'string')
	// 	// NOTE: Sometimes is a string ('+28.04'), sometimes is a number? This is to remove all the weird numbers (23590)
	// 	// UPDATE NOTE: It will be number on winOS, string on mac
	// )
	filteredWorksheet = filteredWorksheet.filter(
		(x) =>
			x.Description !== undefined &&
			x.Amount !== undefined &&
			x.Description !== 'Note' &&
			x.Amount !== 'Amount (total)' &&
			// typeof x.Description === 'string' &&
			(typeof x.Amount === 'number' || typeof x.Amount === 'string')
		// NOTE: Sometimes is a string ('+28.04'), sometimes is a number? This is to remove all the weird numbers (23590)
		// UPDATE NOTE: It will be number on winOS, string on mac
	)

	let incomingChargeWorksheet = filteredWorksheet.filter((x) => x.Type === 'Charge' && x.To !== 'William Yang')
	let outgoingChargeWorksheet = filteredWorksheet.filter((x) => x.Type === 'Charge' && x.To === 'William Yang')

	let incomingPaymentWorksheet = filteredWorksheet.filter((x) => x.Type === 'Payment' && x.From !== 'William Yang')
	let outgoingPaymentWorksheet = filteredWorksheet.filter((x) => x.Type === 'Payment' && x.From === 'William Yang')

	// Loop through the entier thing and make two different ones for charge and payment
	let incomingCharge = calculateAmount(incomingChargeWorksheet)
	// TODO: - Need to figure out why some amounts are numbers and not strings fmor the workbook
	let incomingPayment = calculateAmount(incomingPaymentWorksheet)

	Object.keys(incomingCharge).forEach((x) => {
		incomingChargeWorksheet.unshift({ [x]: incomingCharge[x] })
	})
	Object.keys(incomingPayment).forEach((x) => {
		incomingPaymentWorksheet.unshift({ [x]: incomingPayment[x] })
	})

	printTextFile(`Venmo Charge Report.txt`, incomingChargeWorksheet)
	printTextFile(`Venmo Payment Report.txt`, incomingPaymentWorksheet)
}

const generateSingleCategoryReport = (filename, category) => {
	let workbook = XLSX.readFile(filename) // load the actual workbook
	let sheetName = workbook.SheetNames[0] // get the name of the first sheet
	let worksheet = workbook.Sheets[sheetName] // get the actual sheet
	// Return JSON version of the sheet
	let filteredWorksheet = XLSX.utils.sheet_to_json(worksheet).map((x) => ({
		Description: x['Description'],
		Amount: x['Amount'],
		Category: x['Category'],
	}))

	let categories = {}
	let singleCategoryWorksheet = []
	filteredWorksheet.forEach((x) => {
		if (x.Category === category) {
			if (categories.hasOwnProperty(x.Category)) categories[x.Category] = categories[x.Category] + x.Amount
			else categories[x.Category] = x.Amount
			singleCategoryWorksheet.push(x)
		}
	})

	Object.keys(categories).forEach((x) => {
		singleCategoryWorksheet.unshift({ [x]: categories[x] })
	})

	printTextFile(`${category} Report.txt`, singleCategoryWorksheet)
}

module.exports = {
	findMatches,
	findDuplicatePrices,
	findPricesOverAmount,
	generateSinglePlaceReport,
	formatReport,
	printTextFile,
	generateCategoryReport,
	generateVenmoReport,
	generateSingleCategoryReport,
}

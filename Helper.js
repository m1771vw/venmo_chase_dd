const excelDateToJSDate = (date) => {
	return new Date(Math.round((date - 25569) * 86400 * 1000)).toLocaleDateString()
}

const determineDateFormat = (date) => {
	if (typeof date === 'number') return excelDateToJSDate(date)
	return formatDate(date)
}

const convertVenmoStringToFloat = (amount) => {
	return typeof amount === 'string'
		? parseFloat(amount.replace('-', '').replace('+', '').replace('$', '').trim())
		: amount
}

const calculateAmount = (filteredWorksheet) => {
	let cashFlowType = {}
	filteredWorksheet.forEach((transaction) => {
		if (cashFlowType.hasOwnProperty(transaction.Type)) {
			cashFlowType[transaction.Type] = cashFlowType[transaction.Type] + convertVenmoStringToFloat(transaction.Amount)
		} else {
			cashFlowType[transaction.Type] = convertVenmoStringToFloat(transaction.Amount)
		}
	})
	return cashFlowType
}

module.exports = {
	excelDateToJSDate,
	determineDateFormat,
	convertVenmoStringToFloat,
	calculateAmount,
}

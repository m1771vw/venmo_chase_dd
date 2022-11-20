const excelDateToJSDate = (date) => {
	return new Date(Math.round((date - 25569) * 86400 * 1000)).toLocaleDateString()
}

const determineDateFormat = (date) => {
	if (typeof date === 'number') return excelDateToJSDate(date)
	return formatDate(date)
}

module.exports = {
	excelDateToJSDate,
	determineDateFormat,
}

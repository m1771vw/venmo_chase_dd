const findMatches = (doordashSheetJson, venmosheetJson) => {
  console.log('Trying to find matches.....')
  let foundCharges = []
  let missingCharges = []
  doordashSheetJson.forEach((charge, index) => {
    // Remove negative signs from chase side
    let formattedCharge = charge.Amount.toString().replace('-', '')
    // Keep track of whether we found something or not
    let chargeFound = false 
    // ex: 12.1 found -> 12.10 for consistency 
    if (formattedCharge[formattedCharge.length - 2] === '.') formattedCharge = formattedCharge + '0'
    venmosheetJson.forEach((x) => {
        // if data comes in like + $, remove this. Might not appear in newer venmo data
      let formattedAmount = x.Amount.toString().replace('+ $', '')
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

module.exports = { findMatches }

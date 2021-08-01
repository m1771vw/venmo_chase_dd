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
  amountFoundIndices.forEach(x => duplicateAmounts.push(workSheetJson[x]))
  return duplicateAmounts
}

// Provide a vendor to look for and it'll return a report
// Ex: Give me all prices from Stater Bros
// Return all prices and return total price 
const generateSinglePlaceReport = (workSheetJson, storeName) => {

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
    amountFoundIndices.forEach(x => expensiveAmounts.push(workSheetJson[x]))

    return expensiveAmounts
}
module.exports = { findMatches, findDuplicatePrices, findPricesOverAmount }

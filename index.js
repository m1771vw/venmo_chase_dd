// Import the library
if (typeof require !== "undefined") XLSX = require("xlsx");
// Load the workbook
// TODO: - app config 
let workbook = XLSX.readFile(
  "Chase4589_Activity20210701_20210728_20210729.csv"
);
let sheetName = workbook.SheetNames[0];
let worksheet = workbook.Sheets[sheetName];
let sheets = workbook.Sheets[sheetName];
let sheetJson = XLSX.utils
  .sheet_to_json(worksheet)
  .map((x) => ({ Description: x.Description, Amount: x.Amount }));
// console.log(sheetJson);
let doordashSheetJson = sheetJson.filter((x) =>
  x.Description.includes("DOORDASH")
);
// console.log(doordashSheetJson)

/*
  Venmo Worksheet
*/
let venmoworkbook = XLSX.readFile("venmo_statement_0701_0728.csv");
let venmosheetName = venmoworkbook.SheetNames[0];
let venmoworksheet = venmoworkbook.Sheets[venmosheetName];
let venmosheets = venmoworkbook.Sheets[venmosheetName];
// console.log(XLSX.utils.sheet_to_json(venmoworksheet));

let venmosheetJson = XLSX.utils
  .sheet_to_json(venmoworksheet)
  .map((x) => ({ Description: x.__EMPTY_4, Amount: x.__EMPTY_7 }));
// console.log(venmosheetJson)
// Array to hold all the ones that just have numbers. TODO: - Print these out in another report to fix these manually
let venmosheetJsonHasNumber = venmosheetJson.filter(
  (x) => typeof x.Description === "number" || typeof x.Amount === "number"
);
// console.log(venmosheetJsonHasNumber)

venmosheetJson = venmosheetJson.filter(
  (x) =>
    x.Description !== undefined &&
    x.Amount !== undefined &&
    x.Description !== "Note" &&
    x.Amount !== "Amount (total)" &&
    typeof x.Description === "string" &&
    typeof x.Amount === "number" // sometimes is a string?? but is now a number now somehow
);
// console.log(venmosheetJson)
console.log("Trying to find matches.....");
let foundCharges = [];
let missingCharges = [];
doordashSheetJson.forEach((charge, index) => {
  let formattedCharge = charge.Amount.toString().replace("-", "")
  let chargeFound = false;
  if(formattedCharge[formattedCharge.length-2] === ".")
    formattedCharge = formattedCharge + "0"
  venmosheetJson.forEach((x) => {
    // console.log("Searching :", charge)
    // console.log("Checking: " + charge.Amount.toString().replace('-','').trim()+"vs."+ x.Amount.toString().replace('+ $',''))
    let formattedAmount = x.Amount.toString().replace("+ $", "")
    if (formattedAmount === formattedCharge) {
      // console.log("FOUND YOU: ", x.Description, ", Index:", index);
      // doordashSheetJson.splice(index, 1); 
      foundCharges.push(charge);
      chargeFound = true;
    } 
  });
  if (chargeFound === false) missingCharges.push(charge);
})

// doordashSheetJson.forEach((charge, index) => {
//   console.log("REMAINING: ", charge.Description, " ", charge.Amount)

// });

foundCharges.forEach((charge, index) => {
  console.log("FOUND CHARGES: ", charge.Description, " ", charge.Amount)

});
missingCharges.forEach((charge, index) => {
  console.log("NOT FOUND CHARGES: ", charge.Description, " ", charge.Amount)

});
// venmosheetJson.forEach(x => {
//     // console.log("Searching :", charge)
//     // console.log("Checking: " + doordashSheetJson[3].Amount.toString().replace('-','').trim()+"vs."+ x.Amount.toString().replace('+ $',''))
//     if(x.Amount.toString().replace('+ $', '') === doordashSheetJson[3].Amount.toString().replace('-',''))
//       console.log("FOUND YOU",x.Description)
//   })

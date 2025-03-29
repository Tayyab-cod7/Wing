const fs = require('fs');
const path = require('path');

// List of files to update
const filesToUpdate = [
  'public/basic.html',
  'public/user.html',
  'public/refferal.html',
  'public/recharge.html',
  'public/recharge-record.html',
  'public/profile.html',
  'public/pro.html',
  'public/premium.html',
  'public/jazzcash-payment.html',
  'public/earn.html'
];

// Function to update a file
function updateFile(filePath) {
  console.log(`Updating ${filePath}...`);
  
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace userToken with token
    const updatedContent = content.replace(/localStorage\.getItem\('userToken'\)/g, "localStorage.getItem('token')");
    
    // Replace localStorage.removeItem('userToken') with localStorage.removeItem('token')
    const finalContent = updatedContent.replace(/localStorage\.removeItem\('userToken'\)/g, "localStorage.removeItem('token')");
    
    // Update API_URL if needed
    const apiUrlUpdated = finalContent.replace(/const API_URL = 'http:\/\/localhost:8080'/g, "const API_URL = 'http://localhost:5000'");
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, apiUrlUpdated);
    
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Update all files
filesToUpdate.forEach(file => {
  updateFile(file);
});

console.log('All files updated successfully!'); 
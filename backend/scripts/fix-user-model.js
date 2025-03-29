const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixUserModel() {
  try {
    // Path to the User model file
    const userModelPath = path.join(__dirname, 'src', 'models', 'User.js');
    
    // Read the User model file
    console.log('Reading User model file...');
    let userModelContent = fs.readFileSync(userModelPath, 'utf8');
    
    // Find the password field definition
    const passwordFieldRegex = /password: \{[\s\S]*?select: false\s*\}/;
    const passwordField = userModelContent.match(passwordFieldRegex);
    
    if (!passwordField) {
      console.error('Password field not found in User model');
      return;
    }
    
    console.log('Current password field:');
    console.log(passwordField[0]);
    
    // Create a new password field definition without the validation constraints
    const newPasswordField = `password: {
    type: String,
    required: [true, 'Please add a password'],
    select: false
  }`;
    
    // Replace the password field in the User model
    const updatedUserModelContent = userModelContent.replace(passwordFieldRegex, newPasswordField);
    
    // Write the updated User model back to the file
    console.log('Writing updated User model...');
    fs.writeFileSync(userModelPath, updatedUserModelContent);
    
    console.log('User model updated successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUserModel(); 
// Usage:  node scripts/makeAdmin.js <email>
// Promotes an existing user to the admin role.
// The user must already be registered via the normal /auth/register flow.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: 'admin' },
      { new: true },
    ).select('-password');

    if (!user) {
      console.error(`No user found with email: ${email}`);
      console.error('Tip: register the account first at /register, then run this script.');
      process.exit(1);
    }

    console.log('Success — user promoted to admin:');
    console.log(`  name:  ${user.name}`);
    console.log(`  email: ${user.email}`);
    console.log(`  role:  ${user.role}`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();

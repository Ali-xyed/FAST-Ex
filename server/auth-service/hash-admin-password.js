const bcrypt = require('bcryptjs');

const password = 'Okkake9905$#@';
const hashed = bcrypt.hashSync(password, 10);

console.log('Hashed password:', hashed);
console.log('\n=== MongoDB Document to Insert ===');
console.log('Database: auth_db');
console.log('Collection: User');
console.log('\nDocument:');
const doc = {
  "_id": "m.ahmad.software.engineer@gmail.com",
  "name": "Muhammad Ahmad",
  "rollNo": "ADMIN001",
  "password": hashed,
  "isVerified": true,
  "isBan": false,
  "role": "admin",
  "reputationScore": 100,
  "createdAt": new Date()
};
console.log(JSON.stringify(doc, null, 2));

console.log('\n=== MongoDB Shell Command ===');
console.log('use auth_db');
console.log('db.User.insertOne(' + JSON.stringify(doc, null, 2) + ')');

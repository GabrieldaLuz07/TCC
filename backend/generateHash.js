const bcrypt = require('bcryptjs');

async function createHash() {
  const senhaPura = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(senhaPura, salt);
  console.log('NOVO HASH:', hash);
}
createHash();
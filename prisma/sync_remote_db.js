const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'typamine-db';
const DUMP_FILE = path.join(__dirname, 'remote-dump.sql');
const LOCAL_DB_FILE = path.join(__dirname, 'dev.db');

console.log('🔄 Starting remote D1 database synchronization...');

try {
  // Step 1: Export remote D1 database
  console.log(`📥 Exporting remote database '${DB_NAME}' to ${DUMP_FILE}...`);
  execSync(`npx wrangler d1 export ${DB_NAME} --remote --output="${DUMP_FILE}"`, {
    stdio: 'inherit',
    shell: true
  });

  // Step 2: Ensure Prisma has created the local database structure
  console.log('🏗️ Ensuring local database exists...');
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    shell: true
  });

  // Step 3: Apply the SQL dump to the local dev.db
  // Since sqlite3 CLI might not be installed on Windows, we'll use a basic node sqlite3 approach or wrangler
  // Wait, wrangler doesn't let us specify a custom sqlite file easily.
  // Let's use a quick script with a generic DB approach. 
  // Actually, standard Prisma workflow: we can't easily execute a full dump via PrismaClient ($executeRaw doesn't support multiple statements well).
  // We'll require the user to have `sqlite3` CLI installed, OR we can just use `libSql` / `better-sqlite3` since it's likely installed by prisma/d1.
  console.log(`💾 Note: For a full restore on Windows, you can manually run: sqlite3 ${LOCAL_DB_FILE} < ${DUMP_FILE}`);
  console.log('Using npx prisma db execute (if preview feature enabled) or falling back to sqlite3...');
  
  try {
    // If sqlite3 is available, use it (standard on Mac/Linux, optional on Windows)
    execSync(`sqlite3 "${LOCAL_DB_FILE}" < "${DUMP_FILE}"`, { stdio: 'inherit', shell: true });
    console.log('✅ Synchronized successfully using sqlite3.');
  } catch (err) {
    console.log('⚠️ Could not run sqlite3 CLI directly. Please install sqlite3 or apply the dump manually.');
    console.log(`Dump file saved at: ${DUMP_FILE}`);
  }

} catch (error) {
  console.error('❌ Error during synchronization:', error.message);
  process.exit(1);
}

const fs = require('fs');
const content = fs.readFileSync('scripts/bootstrap_db.sh', 'utf8');

// Replace DB_APP_PASSWORD usage in connection string to be escaped
const replaced = content.replace(
    /Password=\$\{RUNTIME_DB_PASSWORD\}/g,
    "Password='${RUNTIME_DB_PASSWORD_ESCAPED}'"
);

fs.writeFileSync('scripts/bootstrap_db.sh.new', replaced);

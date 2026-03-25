import db from './database.js';

db.serialize(() => {
    // Re-map the ID of the existing user from 3 to 1
    db.run("UPDATE users SET id = 1 WHERE id = 3");
    // Reset the auto increment counter
    db.run("UPDATE sqlite_sequence SET seq = 1 WHERE name = 'users'");
});

setTimeout(() => {
    console.log("Database sequence updated successfully!");
    process.exit(0);
}, 1000);

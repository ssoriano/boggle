const Pool = require('pg').Pool;

const pool = new Pool({
    user: "wordbox_game_db_user",
    host: "localhost",
    database: "wordbox_game_db",
    password: "admin123",
    port: 5432
})

module.exports = {
    pool
}
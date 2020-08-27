const Pool = require("pg").Pool;

const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASS,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDB
})

module.exports = pool;
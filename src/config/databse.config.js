import pg from 'pg'
const { Pool, Client } = pg
 
const pool = new Pool({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'testing',
})
 
console.log(await pool.query('SELECT NOW()'))
 
const client = new Client({
    user: 'postgres',
    password: 'admin',
    host: 'localhost',
    port: 5432,
    database: 'testing',
})
 
await client.connect()
 
console.log(await client.query('SELECT NOW()'))
 
await client.end()
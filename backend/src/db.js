import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

let pool = null;

export async function initializeDatabase() {
  console.log('Initializing MySQL Database...');
  let connection;
  try {
    // 1. Connect without database name to ensure DB exists
    connection = await mysql.createConnection(dbConfig);
    const dbName = process.env.DB_NAME || 'moodtunes';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" verified/created.`);
  } catch (error) {
    console.error('Failed to verify/create database:', error.message);
    console.error('Please make sure MySQL server is running and credentials in .env are correct.');
    throw error;
  } finally {
    if (connection) await connection.end();
  }

  // 2. Create connection pool targeting the DB
  const dbName = process.env.DB_NAME || 'moodtunes';
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // 3. Initialize tables from schema.sql
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      // Split statements by semicolon (excluding any semicolons inside quotes/comments)
      // A simple regex split is usually sufficient for our schema.sql
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const conn = await pool.getConnection();
      try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const statement of statements) {
          await conn.query(statement);
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database tables successfully initialized/verified.');
      } finally {
        conn.release();
      }
    } else {
      console.warn('schema.sql not found, skipping table verification.');
    }
  } catch (error) {
    console.error('Failed to initialize database tables:', error.message);
    throw error;
  }
}

// Helper query function
export async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  const [results] = await pool.query(sql, params);
  return results;
}

export default {
  initializeDatabase,
  query,
};

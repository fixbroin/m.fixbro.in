import mysql, { Pool } from 'mysql2/promise';

const globalForMysql = globalThis as unknown as {
  mysqlPool: Pool | undefined;
};

const pool =
  globalForMysql.mysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'cineelite',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '15', 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForMysql.mysqlPool = pool;
}

export async function query<T = any>(sql: string, values?: any[]): Promise<T> {
  const [results] = await pool.query(sql, values);
  return results as T;
}

const db = {
  query,
  pool,
};

export default db;

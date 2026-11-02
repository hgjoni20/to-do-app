import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('../../db.db');

export const checkDatabaseConnection = (req, res, next) => {
  db.get('SELECT 1', (err) => {
    if (err) {
      console.error('⚠️ Gabim: Databaza nuk po përgjigjet!', err.message);
      return res.status(500).json({
        success: false,
        error: 'Server Error: Lidhja me bazën e të dhënave dështoi.'
      });
    }
    next();
  });
};


import db from '../config/database.js';

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

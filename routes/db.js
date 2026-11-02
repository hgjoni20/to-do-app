import express from 'express';
import { checkDatabaseConnection } from '../middleware/db-error.js';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('../../db.db', (err) => {
  if (err) {
    console.error('Gabim në lidhje me databazen', err.message);
  } else {
    console.log('Lidhur me sukses me databazen!');
  }
});

const router = express.Router();
router.use(checkDatabaseConnection);

router.get("/display", (req, res) => {
  const query = "SELECT * FROM tasks ORDER BY id DESC";

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Gabim në lexim:", err.message);
      return res.status(500).json({ success: false, error: "Gabim në server" });
    }
    res.status(200).json(rows);
  });
});

router.post("/create", (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ success: false, error: "Titulli është i detyrueshëm!" });
  }

  const query = "INSERT INTO tasks (title, completed) VALUES (?, 0)";

  db.run(query, [title.trim()], function (err) {
    if (err) {
      console.error("Gabim në shtim:", err.message);
      return res.status(500).json({ success: false, error: "Gabim në ruajtjen e databazës" });
    }

    res.status(201).json({
      id: this.lastID,
      title: title.trim(),
      completed: 0
    });
  });
});

router.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const query = "UPDATE tasks SET completed = ? WHERE id = ?";

  db.run(query, [completed ? 1 : 0, id], function (err) {
    if (err) {
      console.error("Gabim në përditësim:", err.message);
      return res.status(500).json({ success: false, error: "Gabim në përditësimin e databazës" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Detyra nuk u gjet!" });
    }

    res.status(200).json({ success: true, message: "Detyra u përditësua me sukses" });
  });
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM tasks WHERE id = ?";

  db.run(query, [id], function (err) {
    if (err) {
      console.error("Gabim në fshirje:", err.message);
      return res.status(500).json({ success: false, error: "Gabim në fshirjen nga databaza" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Detyra nuk u gjet!" });
    }

    res.status(200).json({ success: true, message: "Detyra u fshi me sukses" });
  });
});

export default router;
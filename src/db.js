import initSqlJs from 'sql.js';
import { openDB } from 'sql.js';

const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
});

const createDatabase = async () => {
  const db = await openDB({
    filename: ':memory:',
    locator: {
      sqljs: {
        sqljs: SQL
      }
    }
  });
  return db;
};

const executeQuery = async (db, query, params = []) => {
  const result = await db.exec(query, params);
  return result;
};

const createTables = async (db) => {
  await executeQuery(db, `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  await executeQuery(db, `
    CREATE TABLE IF NOT EXISTS instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      creation_date TEXT NOT NULL,
      modification_date TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  await executeQuery(db, `
    CREATE TABLE IF NOT EXISTS steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instruction_id INTEGER,
      step_number INTEGER NOT NULL,
      text TEXT NOT NULL,
      media_type TEXT,
      media_data TEXT,
      FOREIGN KEY (instruction_id) REFERENCES instructions(id)
    );
  `);
};

const addCategory = async (db, name) => {
  await executeQuery(db, `
    INSERT INTO categories (name) VALUES (?);
  `, [name]);
};

const getCategories = async (db) => {
  const result = await executeQuery(db, `
    SELECT * FROM categories;
  `);
  return result[0].values;
};

const deleteCategory = async (db, id) => {
  await executeQuery(db, `
    DELETE FROM categories WHERE id = ?;
  `, [id]);
};

const addInstruction = async (db, category_id, title, description, creation_date) => {
  await executeQuery(db, `
    INSERT INTO instructions (category_id, title, description, creation_date) VALUES (?, ?, ?, ?);
  `, [category_id, title, description, creation_date]);
};

const getInstructions = async (db) => {
  const result = await executeQuery(db, `
    SELECT * FROM instructions;
  `);
  return result[0].values;
};

const deleteInstruction = async (db, id) => {
  await executeQuery(db, `
    DELETE FROM instructions WHERE id = ?;
  `, [id]);
};

const addStep = async (db, instruction_id, step_number, text, media_type, media_data) => {
  await executeQuery(db, `
    INSERT INTO steps (instruction_id, step_number, text, media_type, media_data) VALUES (?, ?, ?, ?, ?);
  `, [instruction_id, step_number, text, media_type, media_data]);
};

const getSteps = async (db, instruction_id) => {
  const result = await executeQuery(db, `
    SELECT * FROM steps WHERE instruction_id = ?;
  `, [instruction_id]);
  return result[0].values;
};

const deleteStep = async (db, id) => {
  await executeQuery(db, `
    DELETE FROM steps WHERE id = ?;
  `, [id]);
};

export { createDatabase, createTables, addCategory, getCategories, deleteCategory, addInstruction, getInstructions, deleteInstruction, addStep, getSteps, deleteStep };

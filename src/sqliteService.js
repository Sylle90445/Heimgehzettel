import { createClient } from '/libsql/client.js';

let db;

const initDB = async () => {
  if (!db) {
    db = createClient({
      url: 'file:workInstructions.db',
    });
    await db.execute(`
      CREATE TABLE IF NOT EXISTS work_instructions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        steps TEXT,
        creationDate TEXT,
        modificationDate TEXT,
        translations TEXT
      )
    `);
  }
  return db;
};

class SQLiteService {
  constructor() {
    this.dbPromise = initDB();
  }

  async readData(category) {
    const db = await this.dbPromise;
    const result = await db.execute({
      sql: 'SELECT * FROM work_instructions WHERE category = ?',
      args: [category],
    });
    return result.rows.map(row => ({
      ...row,
      steps: JSON.parse(row.steps),
      translations: JSON.parse(row.translations)
    }));
  }

  async addItem(category, item) {
    const db = await this.dbPromise;
    const result = await db.execute({
      sql: `
        INSERT INTO work_instructions (
          category, title, description, steps, creationDate, translations
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        category,
        item.title,
        item.description,
        JSON.stringify(item.steps),
        item.creationDate,
        JSON.stringify(item.translations)
      ],
    });
    return { ...item, id: result.lastInsertRowid };
  }

  async updateItem(category, id, item) {
    const db = await this.dbPromise;
    await db.execute({
      sql: `
        UPDATE work_instructions 
        SET title = ?, description = ?, steps = ?, modificationDate = ?, translations = ?
        WHERE id = ? AND category = ?
      `,
      args: [
        item.title,
        item.description,
        JSON.stringify(item.steps),
        item.modificationDate,
        JSON.stringify(item.translations),
        id,
        category
      ],
    });
  }

  async deleteItem(category, id) {
    const db = await this.dbPromise;
    await db.execute({
      sql: 'DELETE FROM work_instructions WHERE id = ? AND category = ?',
      args: [id],
    });
  }
}

const dbService = new SQLiteService();
export default dbService;

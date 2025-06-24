const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = 9001;

app.use(bodyParser.json());

const db = createClient({
  url: 'file:workInstructions.db',
});

// Serve a simple HTML page at the root
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interaktive Arbeitsanweisungs-App</title>
    </head>
    <body>
      <h1>Willkommen in der Interaktiven Arbeitsanweisungs-App</h1>
      <p>Use the API endpoints to manage work instructions.</p>
      <ul>
        <li><a href="/api/instructions">View Instructions</a></li>
        <li>Use a tool like Postman to POST instructions to <code>/api/instructions</code></li>
      </ul>
    </body>
    </html>
  `);
});

// Endpoint to get instructions
app.get('/api/instructions/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await db.execute({
      sql: 'SELECT * FROM work_instructions WHERE category = ?',
      args: [category],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read instructions' });
  }
});

// Endpoint to save instructions
app.post('/api/instructions', async (req, res) => {
  try {
    const { category, title, description, steps, creationDate, translations } = req.body;
    const result = await db.execute({
      sql: `
        INSERT INTO work_instructions (
          category, title, description, steps, creationDate, translations
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        category,
        title,
        description,
        JSON.stringify(steps),
        creationDate,
        JSON.stringify(translations)
      ],
    });
    res.status(200).json({ message: 'Instructions saved successfully', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save instructions' });
  }
});

// Endpoint to update instructions
app.put('/api/instructions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, steps, modificationDate, translations } = req.body;
    await db.execute({
      sql: `
        UPDATE work_instructions 
        SET title = ?, description = ?, steps = ?, modificationDate = ?, translations = ?
        WHERE id = ?
      `,
      args: [
        title,
        description,
        JSON.stringify(steps),
        modificationDate,
        JSON.stringify(translations),
        id
      ],
    });
    res.status(200).json({ message: 'Instructions updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update instructions' });
  }
});

// Endpoint to delete instructions
app.delete('/api/instructions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: 'DELETE FROM work_instructions WHERE id = ?',
      args: [id],
    });
    res.status(200).json({ message: 'Instructions deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete instructions' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

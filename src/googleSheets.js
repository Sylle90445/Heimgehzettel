import { GoogleSpreadsheet } from 'google-spreadsheet';
import credentials from './workinstruction-app-d6858e5552ad.json'; // Ersetzen Sie dies durch den Pfad zu Ihrer JSON-Datei

const doc = new GoogleSpreadsheet('1ux1fK-Rky16ezUp6W4cf63s_jRpHsWHPgjoP5JCYL_8'); // Ersetzen Sie dies durch die ID Ihres Google Spreadsheets

export const initGoogleSheets = async () => {
  await doc.useServiceAccountAuth({
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  });
  await doc.loadInfo();
};

export const getSheetData = async (sheetName) => {
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  const rows = await sheet.getRows();
  return rows.map(row => row.toJSON());
};

export const addRow = async (sheetName, data) => {
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  await sheet.addRow(data);
};

export const updateRow = async (sheetName, rowIndex, data) => {
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  const rows = await sheet.getRows();
  const row = rows[rowIndex];
  if (!row) {
    throw new Error(`Row ${rowIndex} not found`);
  }
  await row.save(data);
};

export const deleteRow = async (sheetName, rowIndex) => {
  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  const rows = await sheet.getRows();
  const row = rows[rowIndex];
  if (!row) {
    throw new Error(`Row ${rowIndex} not found`);
  }
  await row.delete();
};

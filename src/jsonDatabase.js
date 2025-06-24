const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'instructions.json');

const readData = () => {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const addItem = (item) => {
  const data = readData();
  item.id = (data.length + 1).toString();
  data.push(item);
  writeData(data);
};

const updateItem = (id, updatedItem) => {
  const data = readData();
  const index = data.findIndex(item => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updatedItem };
    writeData(data);
  }
};

const deleteItem = (id) => {
  const data = readData();
  const updatedData = data.filter(item => item.id !== id);
  writeData(updatedData);
};

module.exports = {
  readData,
  writeData,
  addItem,
  updateItem,
  deleteItem
};

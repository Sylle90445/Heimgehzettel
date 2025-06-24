// Hilfsskript, um bestehende instructions.json auf Key-basiertes Modell umzustellen
// (Einmalig ausführen, dann instructions.json ersetzen)
import fs from 'fs';
import path from 'path';

const instructionsPath = path.join(__dirname, 'instructions.json');
const translationsPath = path.join(__dirname, 'translations.json');

const instructions = JSON.parse(fs.readFileSync(instructionsPath, 'utf-8'));
let translations = fs.existsSync(translationsPath)
  ? JSON.parse(fs.readFileSync(translationsPath, 'utf-8'))
  : { de: {}, en: {} };

function toKey(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

for (const category in instructions) {
  instructions[category].forEach(instr => {
    // Titel und Beschreibung
    const titleKey = `title_${toKey(instr.title)}`;
    const descKey = `desc_${toKey(instr.description)}`;
    translations.de[titleKey] = instr.title;
    translations.de[descKey] = instr.description;
    instr.titleKey = titleKey;
    instr.descriptionKey = descKey;
    delete instr.title;
    delete instr.description;

    // Schritte
    instr.steps.forEach(step => {
      if (step.text) {
        const stepKey = `step_${toKey(step.text)}`;
        translations.de[stepKey] = step.text;
        step.textKey = stepKey;
        delete step.text;
      }
    });
  });
}

fs.writeFileSync(
  path.join(__dirname, 'instructions.migrated.json'),
  JSON.stringify(instructions, null, 2)
);
fs.writeFileSync(
  translationsPath,
  JSON.stringify(translations, null, 2)
);

console.log('Migration abgeschlossen! Neue Dateien: instructions.migrated.json und translations.json');

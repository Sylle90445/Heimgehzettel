import { getTranslation } from './getTranslation';

/**
 * Returns a translated copy of the instruction object for the print window
 * @param {object} instruction - The instruction object to translate
 * @param {string} lang - The target language code ('en', 'pl', 'cs')
 * @returns {Promise<object>} - The translated instruction object
 */
export async function getTranslatedPrintData(instruction, lang = 'de') {
  // 1. Input Validation
  if (!instruction || typeof instruction !== 'object') {
    console.error('Invalid instruction object');
    return instruction;
  }

  // 2. Skip translation if German or invalid language
  if (!lang || lang.toLowerCase() === 'de') {
    return instruction;
  }

  try {
    // 3. Translate main fields
    const translatedData = {
      title: getTranslation(instruction.title, lang) || instruction.title,
      description: getTranslation(instruction.description, lang) || instruction.description,
      steps: []
    };

    // 4. Translate each step
    if (Array.isArray(instruction.steps)) {
      translatedData.steps = instruction.steps.map(step => ({
        ...step,
        text: getTranslation(step.text, lang) || step.text,
        // Preserve original media
        media: step.media || [] 
      }));
    }

    // 5. Merge with original data
    return {
      ...instruction,
      ...translatedData,
      descriptionImages: instruction.descriptionImages || []
    };

  } catch (error) {
    console.error('Translation failed:', error);
    return instruction; // Fallback to original
  }
}

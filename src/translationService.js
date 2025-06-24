const LIBRE_TRANSLATE_API = 'https://libretranslate.de/translate';
const SUPPORTED_LANGUAGES = ['en', 'de', 'pl', 'cs'];

export const translateText = async (text, targetLang) => {
  try {
    const response = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'de',
        target: targetLang,
        format: 'text'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // return original text if translation fails
  }
};

export const translateInstruction = async (instruction, targetLang) => {
  if (targetLang === 'de') return instruction; // no need to translate if target is German

  try {
    const translatedInstruction = {
      ...instruction,
      title: await translateText(instruction.title, targetLang),
      description: await translateText(instruction.description, targetLang),
      steps: await Promise.all(
        instruction.steps.map(async (step) => {
          try {
            return {
              ...step,
              text: await translateText(step.text, targetLang)
            };
          } catch (error) {
            console.error('Error translating step:', error);
            return {
              ...step,
              text: `Translation failed for step to ${targetLang}`
            };
          }
        })
      )
    };

    return translatedInstruction;
  } catch (error) {
    console.error('Error translating instruction:', error);
    return {
      ...instruction,
      title: `Translation failed for title to ${targetLang}`,
      description: `Translation failed for description to ${targetLang}`,
      steps: instruction.steps.map(step => ({
        ...step,
        text: `Translation failed for step to ${targetLang}`
      }))
    };
  }
};

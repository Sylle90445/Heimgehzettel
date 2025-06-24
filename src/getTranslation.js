/**
 * @typedef {Object.<string, Object.<string, string>>} Translations
 */

const translations = require('./translations.json');

// Cache für exakte Übersetzungen
const exactTranslationCache = new Map();
// Cache für Buchstabenübersetzungen
const letterTranslationCache = new Map();

// Initialisierung des Caches
function initCache() {
    Object.keys(translations).forEach(lang => {
        // Cache für ganze Wörter
        const langCache = new Map();
        // Cache für einzelne Buchstaben
        const letterCache = new Map();
        
        Object.entries(translations[lang]).forEach(([key, value]) => {
            // Case-insensitive Speicherung für ganze Wörter
            langCache.set(key.toLowerCase(), value);
            
            // Buchstabenübersetzungen speichern
            if (key.length === 1 && value.length === 1) {
                letterCache.set(key.toLowerCase(), value.toLowerCase());
            }
        });
        
        exactTranslationCache.set(lang, langCache);
        letterTranslationCache.set(lang, letterCache);
    });
}

initCache();

function translateLetters(word, letterCache) {
    if (!letterCache || letterCache.size === 0) return word;
    
    let translated = '';
    for (const char of word.toLowerCase()) {
        translated += letterCache.has(char) ? letterCache.get(char) : char;
    }
    return translated;
}

export function getTranslation(textKey, lang = 'de') {
    if (!textKey || typeof textKey !== 'string') return textKey;
    
    const langCache = exactTranslationCache.get(lang) || exactTranslationCache.get('de');
    const letterCache = letterTranslationCache.get(lang) || letterTranslationCache.get('de');
    if (!langCache) return textKey;

    // 1. Versuche exakten Match (case-insensitive)
    const lowerInput = textKey.toLowerCase();
    if (langCache.has(lowerInput)) {
        return langCache.get(lowerInput);
    }

    // 2. Für zusammengesetzte Texte
    const words = textKey.split(/(\s+)/); // Leerzeichen behalten
    const translatedWords = words.map(token => {
        // Wenn es sich um Leerzeichen handelt, einfach zurückgeben
        if (/^\s+$/.test(token)) return token;
        
        const lowerToken = token.toLowerCase();
        
        // Versuche das ganze Wort zu übersetzen
        if (langCache.has(lowerToken)) {
            return langCache.get(lowerToken);
        }
        
        // Wenn das ganze Wort nicht übersetzt werden kann, versuche Buchstabe für Buchstabe
        const letterTranslated = translateLetters(token, letterCache);
        
        // Wenn Buchstabenübersetzung etwas geändert hat, nimm das, sonst Original
        return letterTranslated !== lowerToken ? letterTranslated : token;
    });

    // Zusammensetzen des Ergebnisses
    const result = translatedWords.join('');
    
    // Nur zurückgeben wenn sich etwas geändert hat, sonst Originaltext
    return result !== textKey ? result : textKey;
}
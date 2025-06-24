const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB max total storage

const checkStorageQuota = (data) => {
    try {
        // Calculate current storage usage
        let currentSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            currentSize += localStorage.getItem(key).length;
        }

        // Calculate new data size
        const newDataSize = JSON.stringify(data).length;

        // Check if adding new data would exceed quota
        if (currentSize + newDataSize > MAX_STORAGE_SIZE) {
            throw new Error('Storage quota would be exceeded');
        }

        return true;
    } catch (e) {
        console.error('Storage quota check failed:', e);
        return false;
    }
};

const writeData = (key, data) => {
    try {
        if (!checkStorageQuota(data)) {
            throw new Error('Storage quota exceeded. Please delete some items first.');
        }
        console.log(`Writing data to category: ${key} Items count: ${data.length}`);
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error writing data:', error);
        if (error.message.includes('quota')) {
            alert('Storage limit reached. Please delete some existing items before adding new ones.');
        }
        throw error;
    }
};

const readData = (category) => {
    try {
        const data = localStorage.getItem(category);
        const parsedData = data ? JSON.parse(data) : [];
        console.log(`Reading data for category: ${category} Data length: ${parsedData.length}`);
        return parsedData;
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
};

const addItem = async (category, item) => {
    try {
        const existingData = readData(category) || [];
        
        // Resolve all media promises in steps before saving
        const resolvedSteps = await Promise.all(item.steps.map(async (step) => {
            if (!step.media || !Array.isArray(step.media)) {
                return { ...step, media: [] };
            }
            
            const resolvedMedia = await Promise.all(
                step.media.map(async (media) => {
                    if (media instanceof Promise) {
                        return await media;
                    }
                    return media;
                })
            );
            
            return {
                ...step,
                media: resolvedMedia.filter(m => m && m.data && m.type)
            };
        }));

        const newItem = {
            ...item,
            steps: resolvedSteps,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };

        console.log('Adding new item:', {
            category,
            id: newItem.id,
            title: newItem.title,
            stepsCount: newItem.steps.length
        });

        existingData.push(newItem);
        writeData(category, existingData);
        return newItem;
    } catch (error) {
        console.error('Error storing item:', error);
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
            alert('Storage limit reached. Please delete some existing items before adding new ones.');
        } else {
            alert('Error saving data. Please try again.');
        }
        throw error;
    }
};

  
const updateItem = (category, id, updatedItem) => {
    const data = readData(category);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
        data[index] = {
            ...updatedItem,
            id,
            updatedAt: new Date().toISOString()
        };
        writeData(category, data);
        return true;
    }
    return false;
};
  
  const deleteItem = (category, id) => {
    const data = readData(category);
    const filteredData = data.filter(item => item.id !== id);
    if (filteredData.length !== data.length) {
      writeData(category, filteredData);
      return true;
    }
    return false;
  };
  
export {
    readData,
    writeData,
    addItem,
    updateItem,
    deleteItem
};

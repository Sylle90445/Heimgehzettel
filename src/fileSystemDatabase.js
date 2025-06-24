const fs = require('fs');
const path = require('path');

// Create data directory if it doesn't exist
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}

const getCategoryPath = (category) => {
	const categoryDir = path.join(DATA_DIR, category);
	if (!fs.existsSync(categoryDir)) {
		fs.mkdirSync(categoryDir, { recursive: true });
	}
	return path.join(categoryDir, 'instructions.json');
};

export const readData = (category) => {
	try {
		const filePath = getCategoryPath(category);
		if (!fs.existsSync(filePath)) {
			return [];
		}
		const data = fs.readFileSync(filePath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error reading data:', error);
		return [];
	}
};

export const addItem = (category, item) => {
	try {
		const filePath = getCategoryPath(category);
		const existingData = readData(category);
		const newItem = {
			...item,
			id: Date.now().toString()
		};

		// Store media files separately
		if (item.steps) {
			newItem.steps = item.steps.map((step, stepIndex) => {
				if (step.media) {
					const mediaDir = path.join(DATA_DIR, category, 'media', newItem.id, `step${stepIndex}`);
					fs.mkdirSync(mediaDir, { recursive: true });
					
					step.media = step.media.map((media, mediaIndex) => {
						const mediaPath = path.join(mediaDir, `media${mediaIndex}.${media.type}`);
						// Remove the data:image/jpeg;base64, prefix
						const base64Data = media.data.replace(/^data:([A-Za-z-+/]+);base64,/, '');
						fs.writeFileSync(mediaPath, base64Data, 'base64');
						return {
							...media,
							data: mediaPath // Store the path instead of the data
						};
					});
				}
				return step;
			});
		}

		existingData.push(newItem);
		fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
		return newItem;
	} catch (error) {
		console.error('Error storing item:', error);
		throw error;
	}
};

export const updateItem = (category, id, updatedItem) => {
	try {
		const filePath = getCategoryPath(category);
		const existingData = readData(category);
		const index = existingData.findIndex(item => item.id === id);
		
		if (index !== -1) {
			// Handle media updates similar to addItem
			if (updatedItem.steps) {
				updatedItem.steps = updatedItem.steps.map((step, stepIndex) => {
					if (step.media) {
						const mediaDir = path.join(DATA_DIR, category, 'media', id, `step${stepIndex}`);
						fs.mkdirSync(mediaDir, { recursive: true });
						
						step.media = step.media.map((media, mediaIndex) => {
							if (media.data.startsWith('data:')) {
								const mediaPath = path.join(mediaDir, `media${mediaIndex}.${media.type}`);
								const base64Data = media.data.replace(/^data:([A-Za-z-+/]+);base64,/, '');
								fs.writeFileSync(mediaPath, base64Data, 'base64');
								return {
									...media,
									data: mediaPath
								};
							}
							return media;
						});
					}
					return step;
				});
			}
			
			existingData[index] = { ...updatedItem, id };
			fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
		}
	} catch (error) {
		console.error('Error updating item:', error);
		throw error;
	}
};

export const deleteItem = (category, id) => {
	try {
		const filePath = getCategoryPath(category);
		const existingData = readData(category);
		const filteredData = existingData.filter(item => item.id !== id);
		
		// Delete associated media files
		const mediaDir = path.join(DATA_DIR, category, 'media', id);
		if (fs.existsSync(mediaDir)) {
			fs.rmSync(mediaDir, { recursive: true, force: true });
		}
		
		fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
	} catch (error) {
		console.error('Error deleting item:', error);
		throw error;
	}
};

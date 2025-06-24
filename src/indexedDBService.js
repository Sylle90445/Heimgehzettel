const DB_NAME = 'workInstructionsDB';
const DB_VERSION = 1;
const STORE_NAME = 'instructions';

class IndexedDBService {
	constructor() {
		this.db = null;
		this.initDB();
	}


	initDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.error('Error opening database');
				reject('Error opening database');
			};

			request.onsuccess = (event) => {
				this.db = event.target.result;
				resolve(this.db);
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: ['category', 'id'] });
				}
			};
		});
	}

	async readData(category) {
		await this.ensureDB();
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onsuccess = () => {
				const allData = request.result || [];
				const categoryData = allData.filter(item => item.category === category);
				resolve(categoryData);
			};

			request.onerror = () => reject('Error reading data');
		});
	}

	async addItem(category, item) {
		await this.ensureDB();
		return new Promise((resolve, reject) => {

			const transaction = this.db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const newItem = {
				...item,
				id: Date.now().toString(),
				category,
				creatorName: item.creatorName || 'Unknown',
				creatorDate: item.creatorDate || new Date().toLocaleString(),
				modifierName: item.modifierName || '',
				modifierDate: item.modifierDate || ''
			};
			const request = store.add(newItem);

			request.onsuccess = () => resolve(newItem);
			request.onerror = () => reject('Error adding item');
		});
	}

	async clearAll() {
		await this.ensureDB();
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Error clearing store');
		});
	}

	async getStorageUsage() {
		await this.ensureDB();
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onsuccess = () => {
				const allData = request.result || [];
				const totalSize = allData.reduce((acc, item) => {
					if (item.file && item.file.size) {
						return acc + item.file.size;
					}
					return acc;
				}, 0);
				resolve(totalSize);
			};

			request.onerror = () => reject('Error calculating storage usage');
		});
	}

	async updateItem(category, id, updatedItem) {
		await this.ensureDB();
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.put({
				...updatedItem,
				id,
				category,
				modifierName: updatedItem.modifierName || 'Unknown',
				modifierDate: updatedItem.modifierDate || new Date().toLocaleString()
			});

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Error updating item');
		});
	}

	async deleteItem(category, id) {
		await this.ensureDB();
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.delete([category, id]);

			request.onsuccess = () => resolve();
			request.onerror = () => reject('Error deleting item');
		});
	}

	async ensureDB() {
		if (!this.db) {
			await this.initDB();
		}
	}
}

const dbService = new IndexedDBService();
export default dbService;

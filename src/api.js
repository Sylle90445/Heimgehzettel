import axios from 'axios';

const API_URL = 'http://localhost:9001/api';

export const fetchInstructions = async (category) => {
	try {
		const response = await axios.get(`${API_URL}/instructions/${category}`);
		return response.data;
	} catch (error) {
		console.error('Error fetching instructions:', error);
		throw error;
	}
};

export const addInstruction = async (category, instruction) => {
	try {
		const response = await axios.post(`${API_URL}/instructions`, {
			...instruction,
			category
		});
		return response.data;
	} catch (error) {
		console.error('Error adding instruction:', error);
		throw error;
	}
};

export const updateInstruction = async (id, instruction) => {
	try {
		const response = await axios.put(`${API_URL}/instructions/${id}`, instruction);
		return response.data;
	} catch (error) {
		console.error('Error updating instruction:', error);
		throw error;
	}
};

export const deleteInstruction = async (id) => {
	try {
		await axios.delete(`${API_URL}/instructions/${id}`);
	} catch (error) {
		console.error('Error deleting instruction:', error);
		throw error;
	}
};

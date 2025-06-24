const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware with increased payload limits
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// MongoDB Atlas Connection with optimized settings for larger files
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your_username:your_password@cluster0.mongodb.net/workInstructions?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	maxPoolSize: 10,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => {
	console.error('Error connecting to MongoDB Atlas:', err);
	process.exit(1); // Exit process with failure
});

// Instruction Schema
const instructionSchema = new mongoose.Schema({
	category: String,
	title: String,
	description: String,
	steps: [{
		text: String,
		media: [{
			type: String,
			data: String,
			width: Number,
			height: Number
		}]
	}],
	creationDate: String,
	modificationDate: String
});

const Instruction = mongoose.model('Instruction', instructionSchema);

// Routes
app.get('/api/instructions/:category', async (req, res) => {
	try {
		const instructions = await Instruction.find({ category: req.params.category });
		res.json(instructions);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.post('/api/instructions', async (req, res) => {
	try {
		const instruction = new Instruction(req.body);
		await instruction.save();
		res.json(instruction);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.put('/api/instructions/:id', async (req, res) => {
	try {
		const instruction = await Instruction.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		res.json(instruction);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.delete('/api/instructions/:id', async (req, res) => {
	try {
		await Instruction.findByIdAndDelete(req.params.id);
		res.json({ message: 'Instruction deleted' });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

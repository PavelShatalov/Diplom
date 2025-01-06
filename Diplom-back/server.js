const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Временное хранилище событий (массив в памяти)
let events = [];

// Получить все события
app.get("/api/events", (req, res) => {
	res.json(events);
});

// Создать событие
app.post("/api/events", (req, res) => {
	const { title, startDate, endDate } = req.body;

	if (!title || !startDate || !endDate) {
		return res.status(400).json({ message: "Invalid event data" });
	}

	const start = new Date(startDate);
	const end = new Date(endDate);

	if (end <= start) {
		return res
			.status(400)
			.json({ message: "endDate must be strictly after startDate" });
	}

	const duration = Math.round((end - start) / 60000);

	const newEvent = {
		id: events.length + 1,
		title,
		startDate,
		endDate,
		duration,
	};

	events.push(newEvent);
	return res.status(201).json(newEvent);
});

// Обновить событие
app.put("/api/events/:id", (req, res) => {
	const { id } = req.params;
	const { title, startDate, endDate } = req.body;

	const index = events.findIndex((e) => e.id === parseInt(id));
	if (index === -1) {
		return res.status(404).json({ message: "Event not found" });
	}

	if (!title || !startDate || !endDate) {
		return res.status(400).json({ message: "Invalid event data" });
	}

	const start = new Date(startDate);
	const end = new Date(endDate);

	if (end <= start) {
		return res
			.status(400)
			.json({ message: "endDate must be strictly after startDate" });
	}

	const duration = Math.round((end - start) / 60000);

	events[index] = {
		...events[index],
		title,
		startDate,
		endDate,
		duration,
	};

	res.json(events[index]);
});

// Удалить событие
app.delete("/api/events/:id", (req, res) => {
	const { id } = req.params;
	const index = events.findIndex((e) => e.id === parseInt(id));
	if (index === -1) {
		return res.status(404).json({ message: "Event not found" });
	}
	const deleted = events.splice(index, 1)[0];
	res.json(deleted);
});

const PORT = 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

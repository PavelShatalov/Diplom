const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let events = [];

// Получение всех событий
app.get("/api/events", (req, res) => {
	res.json(events);
});

// Добавление нового события
app.post("/api/events", (req, res) => {
	const { title, date, time, duration } = req.body;
	const newEvent = { id: events.length + 1, title, date, time, duration };
	events.push(newEvent);
	res.status(201).json(newEvent);
});

// Обновление события
app.put("/api/events/:id", (req, res) => {
	const { id } = req.params;
	const { title, date, time, duration } = req.body;

	const eventIndex = events.findIndex((event) => event.id === parseInt(id));
	if (eventIndex === -1) {
		return res.status(404).json({ message: "Event not found" });
	}

	events[eventIndex] = { ...events[eventIndex], title, date, time, duration };
	res.json(events[eventIndex]);
});

// Удаление события
app.delete("/api/events/:id", (req, res) => {
	const { id } = req.params;

	const eventIndex = events.findIndex((event) => event.id === parseInt(id));
	if (eventIndex === -1) {
		return res.status(404).json({ message: "Event not found" });
	}

	const deletedEvent = events.splice(eventIndex, 1);
	res.json(deletedEvent);
});

const PORT = 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

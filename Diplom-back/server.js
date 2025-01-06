const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let events = [];

app.get("/api/events", (req, res) => {
	res.json(events);
});

app.post("/api/events", (req, res) => {
	const { title, startDate, endDate } = req.body;
	if (!title || !startDate || !endDate) {
		return res.status(400).json({ message: "Invalid event data" });
	}
	const start = new Date(startDate);
	const end = new Date(endDate);
	if (end <= start) {
		return res.status(400).json({ message: "endDate must be after startDate" });
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
	res.status(201).json(newEvent);
});

app.put("/api/events/:id", (req, res) => {
	const { id } = req.params;
	const { title, startDate, endDate } = req.body;
	const idx = events.findIndex((e) => e.id === parseInt(id));
	if (idx === -1) {
		return res.status(404).json({ message: "Not found" });
	}
	const start = new Date(startDate);
	const end = new Date(endDate);
	if (end <= start) {
		return res.status(400).json({ message: "endDate must be after startDate" });
	}
	const duration = Math.round((end - start) / 60000);
	events[idx] = {
		...events[idx],
		title,
		startDate,
		endDate,
		duration,
	};
	res.json(events[idx]);
});

app.delete("/api/events/:id", (req, res) => {
	const { id } = req.params;
	const idx = events.findIndex((e) => e.id === parseInt(id));
	if (idx === -1) {
		return res.status(404).json({ message: "Not found" });
	}
	const deleted = events.splice(idx, 1)[0];
	res.json(deleted);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

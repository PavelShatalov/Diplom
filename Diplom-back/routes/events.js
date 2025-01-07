const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const authMiddleware = require("../middleware/auth");

// GET /api/events
router.get("/", authMiddleware, async (req, res) => {
	try {
		const events = await Event.find({ userId: req.userId });
		res.json(events);
	} catch (err) {
		console.error("Get events error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

// POST /api/events
router.post("/", authMiddleware, async (req, res) => {
	try {
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

		const newEvent = new Event({
			title,
			startDate,
			endDate,
			duration,
			userId: req.userId,
		});
		await newEvent.save();
		res.status(201).json(newEvent);
	} catch (err) {
		console.error("Create event error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

// PUT /api/events/:id
router.put("/:id", authMiddleware, async (req, res) => {
	try {
		const { title, startDate, endDate } = req.body;
		const eventId = req.params.id;

		const existing = await Event.findOne({ _id: eventId, userId: req.userId });
		if (!existing) {
			return res.status(404).json({ message: "Event not found" });
		}

		const start = new Date(startDate);
		const end = new Date(endDate);
		if (end <= start) {
			return res
				.status(400)
				.json({ message: "endDate must be after startDate" });
		}

		const duration = Math.round((end - start) / 60000);

		existing.title = title;
		existing.startDate = startDate;
		existing.endDate = endDate;
		existing.duration = duration;
		await existing.save();

		res.json(existing);
	} catch (err) {
		console.error("Update event error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

// DELETE /api/events/:id
router.delete("/:id", authMiddleware, async (req, res) => {
	try {
		const eventId = req.params.id;
		const existing = await Event.findOne({ _id: eventId, userId: req.userId });
		if (!existing) {
			return res.status(404).json({ message: "Event not found" });
		}
		await existing.remove();
		res.json({ message: "Event deleted" });
	} catch (err) {
		console.error("Delete event error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;

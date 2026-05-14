const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
	title: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	duration: { type: Number, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	source: {
		type: String,
		enum: ["local", "intranet", "google", "outlook"],
		default: "local",
	},
	externalCalendarId: { type: String, default: "" },
	externalEventId: { type: String, default: "" },
	syncStatus: {
		type: String,
		enum: ["local", "pending", "synced", "failed"],
		default: "local",
	},
	reminderMinutes: { type: Number, default: 15, min: 0 },
	reminderSentAt: { type: Date, default: null },
	lastSyncedAt: { type: Date, default: null },
	syncError: { type: String, default: "" },
});

module.exports = mongoose.model("Event", eventSchema);

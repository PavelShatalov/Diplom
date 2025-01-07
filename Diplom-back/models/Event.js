const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
	title: { type: String, required: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	duration: { type: Number, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Event", eventSchema);

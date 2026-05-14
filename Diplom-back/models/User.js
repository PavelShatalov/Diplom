const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
	calendarIntegrations: {
		google: {
			accessToken: { type: String, default: "" },
			refreshToken: { type: String, default: "" },
			expiresAt: { type: Date, default: null },
			connectedAt: { type: Date, default: null },
		},
		outlook: {
			accessToken: { type: String, default: "" },
			refreshToken: { type: String, default: "" },
			expiresAt: { type: Date, default: null },
			connectedAt: { type: Date, default: null },
		},
	},
});

module.exports = mongoose.model("User", userSchema);

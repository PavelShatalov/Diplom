require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const eventsRoutes = require("./routes/events");
const integrationRoutes = require("./routes/integration");

const app = express();
app.use(cors());
app.use(express.json());

// Подключаемся к MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/calendarDB";

mongoose
	.connect(mongoUri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error("MongoDB error:", err));

// Роуты
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/integration", integrationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

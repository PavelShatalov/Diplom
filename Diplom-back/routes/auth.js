const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// Регистрация
router.post("/register", async (req, res) => {
	try {
		const { email, password } = req.body;

		const existing = await User.findOne({ email });
		if (existing) {
			return res.status(400).json({ message: "Email already taken" });
		}

		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);

		const newUser = new User({ email, passwordHash });
		await newUser.save();

		res.status(201).json({ message: "Registered successfully" });
	} catch (err) {
		console.error("Register error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

// Логин
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: "Invalid email or password" });
		}

		const isMatch = await bcrypt.compare(password, user.passwordHash);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid email or password" });
		}

		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET || "SECRET_JWT_KEY",
			{ expiresIn: "1d" }
		);

		res.json({ token });
	} catch (err) {
		console.error("Login error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;

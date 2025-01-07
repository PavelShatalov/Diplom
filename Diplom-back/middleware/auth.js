const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization; // "Bearer TOKEN"
	if (!authHeader) {
		return res.status(401).json({ message: "No auth token" });
	}

	const token = authHeader.split(" ")[1];
	if (!token) {
		return res.status(401).json({ message: "No auth token" });
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "SECRET_JWT_KEY"
		);
		req.userId = decoded.userId;
		next();
	} catch (err) {
		return res.status(403).json({ message: "Invalid token" });
	}
};

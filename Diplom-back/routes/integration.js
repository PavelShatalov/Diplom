const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Event = require("../models/Event");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "SECRET_JWT_KEY";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TIME_ZONE = process.env.CALENDAR_TIME_ZONE || "Europe/Prague";
const OUTLOOK_TIME_ZONE_HEADER = `outlook.timezone="${TIME_ZONE}"`;

const providers = {
	google: {
		authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://oauth2.googleapis.com/token",
		redirectUri:
			process.env.GOOGLE_REDIRECT_URI ||
			"http://localhost:5000/api/integration/google/callback",
		scope: "https://www.googleapis.com/auth/calendar.events",
	},
	outlook: {
		authUrl:
			"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
		tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
		redirectUri:
			process.env.OUTLOOK_REDIRECT_URI ||
			"http://localhost:5000/api/integration/outlook/callback",
		scope: "offline_access Calendars.ReadWrite",
	},
};

function hasProviderConfig(provider) {
	const upper = provider.toUpperCase();
	return Boolean(
		process.env[`${upper}_CLIENT_ID`] &&
			process.env[`${upper}_CLIENT_SECRET`]
	);
}

function getProviderStatus(user) {
	return {
		intranet: {
			enabled: Boolean(process.env.INTRANET_API_URL),
			apiUrl: process.env.INTRANET_API_URL || "",
		},
		google: {
			enabled: hasProviderConfig("google"),
			connected: Boolean(user?.calendarIntegrations?.google?.refreshToken),
		},
		outlook: {
			enabled: hasProviderConfig("outlook"),
			connected: Boolean(user?.calendarIntegrations?.outlook?.refreshToken),
		},
	};
}

function getClientConfig(provider) {
	const upper = provider.toUpperCase();
	return {
		clientId: process.env[`${upper}_CLIENT_ID`],
		clientSecret: process.env[`${upper}_CLIENT_SECRET`],
		...providers[provider],
	};
}

function ensureUserIntegration(user, provider) {
	if (!user.calendarIntegrations) {
		user.calendarIntegrations = {};
	}

	if (!user.calendarIntegrations[provider]) {
		user.calendarIntegrations[provider] = {};
	}

	return user.calendarIntegrations[provider];
}

async function requestToken(provider, params) {
	const config = getClientConfig(provider);
	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		redirect_uri: config.redirectUri,
		...params,
	});

	const response = await fetch(config.tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error_description || data.error || "Token request failed");
	}

	return data;
}

async function ensureAccessToken(user, provider) {
	const integration = ensureUserIntegration(user, provider);
	if (!integration?.refreshToken) {
		throw new Error(`${provider} calendar is not connected`);
	}

	const expiresAt = integration.expiresAt
		? new Date(integration.expiresAt).getTime()
		: 0;

	if (integration.accessToken && expiresAt > Date.now() + 60000) {
		return integration.accessToken;
	}

	const tokenData = await requestToken(provider, {
		grant_type: "refresh_token",
		refresh_token: integration.refreshToken,
	});

	integration.accessToken = tokenData.access_token;
	integration.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
	if (tokenData.refresh_token) {
		integration.refreshToken = tokenData.refresh_token;
	}
	await user.save();

	return integration.accessToken;
}

function getTimeZoneParts(date, timeZone) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});

	return Object.fromEntries(
		formatter
			.formatToParts(date)
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, part.value])
	);
}

function toZonedDateTime(date, timeZone = TIME_ZONE) {
	const parts = getTimeZoneParts(new Date(date), timeZone);

	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function getTimeZoneOffsetMs(date, timeZone) {
	const parts = getTimeZoneParts(date, timeZone);
	const zonedAsUtc = Date.UTC(
		Number(parts.year),
		Number(parts.month) - 1,
		Number(parts.day),
		Number(parts.hour),
		Number(parts.minute),
		Number(parts.second)
	);

	return zonedAsUtc - date.getTime();
}

function parseZonedDateTime(value, timeZone = TIME_ZONE) {
	if (!value) return new Date(Number.NaN);
	if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
		return new Date(value);
	}

	const [datePart, timePart = "00:00:00"] = value.split("T");
	const [year, month, day] = datePart.split("-").map(Number);
	const [hour = 0, minute = 0, second = 0] = timePart
		.split(":")
		.map((part) => Number.parseInt(part, 10));
	const utcGuess = new Date(
		Date.UTC(year, month - 1, day, hour, minute, second)
	);
	const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
	const adjusted = new Date(utcGuess.getTime() - firstOffset);
	const secondOffset = getTimeZoneOffsetMs(adjusted, timeZone);

	return new Date(utcGuess.getTime() - secondOffset);
}

function eventToProviderPayload(event, provider) {
	if (provider === "google") {
		return {
			summary: event.title,
			start: { dateTime: new Date(event.startDate).toISOString() },
			end: { dateTime: new Date(event.endDate).toISOString() },
			reminders: {
				useDefault: false,
				overrides: [{ method: "popup", minutes: event.reminderMinutes || 0 }],
			},
		};
	}

	return {
		subject: event.title,
		start: {
			dateTime: toZonedDateTime(event.startDate),
			timeZone: TIME_ZONE,
		},
		end: {
			dateTime: toZonedDateTime(event.endDate),
			timeZone: TIME_ZONE,
		},
		isReminderOn: true,
		reminderMinutesBeforeStart: event.reminderMinutes || 0,
	};
}

async function upsertProviderEvent(event, provider, accessToken) {
	const payload = eventToProviderPayload(event, provider);
	const eventId = event.externalEventId;
	const isUpdate = event.source === provider && eventId;

	const url =
		provider === "google"
			? `https://www.googleapis.com/calendar/v3/calendars/primary/events${
					isUpdate ? `/${eventId}` : ""
			  }`
			: `https://graph.microsoft.com/v1.0/me/events${
					isUpdate ? `/${eventId}` : ""
			  }`;

	const response = await fetch(url, {
		method: isUpdate ? "PATCH" : "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			...(provider === "outlook" ? { Prefer: OUTLOOK_TIME_ZONE_HEADER } : {}),
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error?.message || data.error_description || "Sync failed");
	}

	return data;
}

async function listProviderEvents(provider, accessToken) {
	const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString();
	const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60000).toISOString();

	const url =
		provider === "google"
			? `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
					timeMin
			  )}&timeMax=${encodeURIComponent(timeMax)}`
			: `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(
					timeMin
			  )}&endDateTime=${encodeURIComponent(timeMax)}`;

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...(provider === "outlook" ? { Prefer: OUTLOOK_TIME_ZONE_HEADER } : {}),
		},
	});
	const data = await response.json();

	if (!response.ok) {
		throw new Error(
			data.error?.message || data.error_description || "Calendar import failed"
		);
	}

	return provider === "google" ? data.items || [] : data.value || [];
}

function normalizeRemoteEvent(remoteEvent, provider) {
	if (provider === "google") {
		const startDate = remoteEvent.start?.dateTime || remoteEvent.start?.date;
		const endDate = remoteEvent.end?.dateTime || remoteEvent.end?.date;

		return {
			externalEventId: remoteEvent.id,
			title: remoteEvent.summary || "Untitled event",
			startDate: new Date(startDate),
			endDate: new Date(endDate),
		};
	}

	return {
		externalEventId: remoteEvent.id,
		title: remoteEvent.subject || "Untitled event",
		startDate: parseZonedDateTime(
			remoteEvent.start?.dateTime,
			remoteEvent.start?.timeZone || TIME_ZONE
		),
		endDate: parseZonedDateTime(
			remoteEvent.end?.dateTime,
			remoteEvent.end?.timeZone || TIME_ZONE
		),
	};
}

async function importProviderEvents(user, provider, accessToken) {
	const remoteEvents = await listProviderEvents(provider, accessToken);
	let imported = 0;

	for (const remoteEvent of remoteEvents) {
		const normalized = normalizeRemoteEvent(remoteEvent, provider);

		if (
			!normalized.externalEventId ||
			Number.isNaN(normalized.startDate.getTime()) ||
			Number.isNaN(normalized.endDate.getTime())
		) {
			continue;
		}

		const duration = Math.max(
			1,
			Math.round((normalized.endDate - normalized.startDate) / 60000)
		);

		await Event.findOneAndUpdate(
			{
				userId: user._id,
				source: provider,
				externalEventId: normalized.externalEventId,
			},
			{
				$set: {
					title: normalized.title,
					color: provider === "outlook" ? "#0f766e" : "#dc2626",
					startDate: normalized.startDate,
					endDate: normalized.endDate,
					duration,
					source: provider,
					externalCalendarId: "primary",
					externalEventId: normalized.externalEventId,
					syncStatus: "synced",
					lastSyncedAt: new Date(),
					syncError: "",
				},
				$setOnInsert: {
					userId: user._id,
					reminderMinutes: 15,
				},
			},
			{ upsert: true, new: true }
		);
		imported += 1;
	}

	return imported;
}

async function pushLocalEvents(user, provider) {
	const accessToken = await ensureAccessToken(user, provider);
	const events = await Event.find({
		userId: user._id,
		source: { $in: ["local", "intranet", provider] },
	});
	let synced = 0;
	let failed = 0;

	for (const event of events) {
		try {
			const remoteEvent = await upsertProviderEvent(event, provider, accessToken);
			event.source = provider;
			event.externalCalendarId = "primary";
			event.externalEventId = remoteEvent.id;
			event.syncStatus = "synced";
			event.lastSyncedAt = new Date();
			event.syncError = "";
			await event.save();
			synced += 1;
		} catch (err) {
			event.syncStatus = "failed";
			event.syncError = err.message;
			await event.save();
			failed += 1;
		}
	}

	const imported = await importProviderEvents(user, provider, accessToken);

	return { synced, failed, imported };
}

router.get("/status", authMiddleware, async (req, res) => {
	try {
		const user = await User.findById(req.userId);
		const [totalEvents, pendingEvents, syncedEvents, failedEvents] =
			await Promise.all([
				Event.countDocuments({ userId: req.userId }),
				Event.countDocuments({ userId: req.userId, syncStatus: "pending" }),
				Event.countDocuments({ userId: req.userId, syncStatus: "synced" }),
				Event.countDocuments({ userId: req.userId, syncStatus: "failed" }),
			]);

		res.json({
			mode: "provider-sync",
			providers: getProviderStatus(user),
			totals: {
				totalEvents,
				pendingEvents,
				syncedEvents,
				failedEvents,
			},
		});
	} catch (err) {
		console.error("Integration status error:", err);
		res.status(500).json({ message: "Server error" });
	}
});

router.get("/:provider/auth-url", authMiddleware, (req, res) => {
	const { provider } = req.params;
	if (!providers[provider]) {
		return res.status(404).json({ message: "Unknown provider" });
	}

	if (!hasProviderConfig(provider)) {
		return res.status(503).json({
			message: `${provider} OAuth credentials are not configured`,
		});
	}

	const config = getClientConfig(provider);
	const state = jwt.sign({ userId: req.userId, provider }, JWT_SECRET, {
		expiresIn: "10m",
	});
	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		response_type: "code",
		scope: config.scope,
		state,
	});

	if (provider === "google") {
		params.set("access_type", "offline");
		params.set("prompt", "consent");
	}

	res.json({ url: `${config.authUrl}?${params.toString()}` });
});

router.get("/:provider/callback", async (req, res) => {
	const { provider } = req.params;
	const { code, state } = req.query;

	try {
		if (!providers[provider] || !code || !state) {
			throw new Error("Invalid OAuth callback");
		}

		const decoded = jwt.verify(state, JWT_SECRET);
		if (decoded.provider !== provider) {
			throw new Error("Invalid OAuth state");
		}

		const user = await User.findById(decoded.userId);
		if (!user) {
			throw new Error("User not found");
		}

		const tokenData = await requestToken(provider, {
			grant_type: "authorization_code",
			code,
		});

		const integration = ensureUserIntegration(user, provider);
		integration.accessToken = tokenData.access_token;
		integration.refreshToken =
			tokenData.refresh_token ||
			integration.refreshToken;
		integration.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
		integration.connectedAt = new Date();
		await user.save();

		res.redirect(`${FRONTEND_URL}/?calendarConnected=${provider}`);
	} catch (err) {
		console.error("OAuth callback error:", err);
		res
			.status(400)
			.send(`Calendar connection failed: ${err.message}`);
	}
});

router.post("/sync", authMiddleware, async (req, res) => {
	try {
		const provider = req.body.provider || "google";
		if (!providers[provider]) {
			return res.status(404).json({ message: "Unknown provider" });
		}

		const user = await User.findById(req.userId);
		const integration = ensureUserIntegration(user, provider);
		if (!integration.refreshToken) {
			return res.status(409).json({
				message: `${provider} calendar is not connected`,
			});
		}

		await Event.updateMany(
			{ userId: req.userId, syncStatus: { $in: ["local", "failed"] } },
			{ $set: { syncStatus: "pending", syncError: "" } }
		);

		const result = await pushLocalEvents(user, provider);

		res.json({
			message: `${provider} synchronization finished.`,
			...result,
		});
	} catch (err) {
		console.error("Integration sync error:", err);
		res.status(500).json({ message: err.message || "Server error" });
	}
});

module.exports = router;

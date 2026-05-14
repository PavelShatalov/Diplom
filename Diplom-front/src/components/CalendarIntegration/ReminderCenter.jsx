import React, { useEffect, useMemo, useState } from "react";

const NOTIFIED_KEY = "calendar-notified-events";

function readNotifiedEvents() {
	try {
		return JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || {};
	} catch {
		return {};
	}
}

function writeNotifiedEvents(value) {
	localStorage.setItem(NOTIFIED_KEY, JSON.stringify(value));
}

export const ReminderCenter = ({ events }) => {
	const [permission, setPermission] = useState(
		typeof Notification === "undefined" ? "unsupported" : Notification.permission
	);

	const upcomingEvents = useMemo(() => {
		const now = Date.now();
		const dayAhead = now + 24 * 60 * 60000;

		return events
			.filter((event) => {
				const start = new Date(event.startDate).getTime();
				return start >= now && start <= dayAhead;
			})
			.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
			.slice(0, 5);
	}, [events]);

	useEffect(() => {
		if (permission !== "granted") return;

		const checkReminders = () => {
			const notified = readNotifiedEvents();
			const now = Date.now();

			events.forEach((event) => {
				const start = new Date(event.startDate).getTime();
				const reminderMs = (event.reminderMinutes ?? 15) * 60000;
				const reminderAt = start - reminderMs;
				const notificationKey = `${event.id || event._id}-${start}`;

				if (
					start > now &&
					reminderAt <= now &&
					!notified[notificationKey]
				) {
					new Notification(event.title, {
						body: `Starts at ${new Date(event.startDate).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}`,
					});
					notified[notificationKey] = new Date().toISOString();
				}
			});

			writeNotifiedEvents(notified);
		};

		checkReminders();
		const intervalId = window.setInterval(checkReminders, 30000);
		return () => window.clearInterval(intervalId);
	}, [events, permission]);

	const requestPermission = async () => {
		if (typeof Notification === "undefined") {
			setPermission("unsupported");
			return;
		}

		const result = await Notification.requestPermission();
		setPermission(result);
	};

	return (
		<section className="mb-4 border border-gray-200 rounded bg-white p-3 shadow-sm">
			<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div>
					<h2 className="text-base font-semibold text-gray-900">Reminders</h2>
					<div className="mt-2 space-y-1 text-sm text-gray-700">
						{upcomingEvents.length === 0 ? (
							<p>No events in the next 24 hours.</p>
						) : (
							upcomingEvents.map((event) => (
								<p key={`${event.id || event._id}-${event.startDate}`}>
									<span className="font-medium">{event.title}</span>{" "}
									{new Date(event.startDate).toLocaleString([], {
										month: "short",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							))
						)}
					</div>
				</div>

				<button
					type="button"
					onClick={requestPermission}
					disabled={permission === "granted" || permission === "unsupported"}
					className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60">
					{permission === "granted"
						? "Notifications enabled"
						: permission === "unsupported"
						? "Not supported"
						: "Enable notifications"}
				</button>
			</div>
		</section>
	);
};

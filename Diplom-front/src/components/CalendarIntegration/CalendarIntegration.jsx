import { useState, useEffect } from "react";
import axios from "axios";

const CalendarIntegration = () => {
	const [events, setEvents] = useState([]);
	const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "" });

	useEffect(() => {
		fetchEvents();
	}, []);

	const fetchEvents = async () => {
		try {
			const response = await axios.get("/api/events");
			setEvents(response.data);
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

	const addEvent = async (event) => {
		try {
			await axios.post("/api/events", event);
			fetchEvents();
		} catch (error) {
			console.error("Error adding event:", error);
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (newEvent.title && newEvent.date && newEvent.time) {
			addEvent(newEvent);
			setNewEvent({ title: "", date: "", time: "" });
		}
	};

	return (
		<div>
			<h1>Intranet Calendar</h1>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					placeholder="Event Title"
					value={newEvent.title}
					onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
				/>
				<input
					type="date"
					value={newEvent.date}
					onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
				/>
				<input
					type="time"
					value={newEvent.time}
					onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
				/>
				<button type="submit">Add Event</button>
			</form>
			<ul>
				{events.map((event) => (
					<li key={event.id}>
						{event.title} - {event.date} at {event.time}
					</li>
				))}
			</ul>
		</div>
	);
};

export default CalendarIntegration;

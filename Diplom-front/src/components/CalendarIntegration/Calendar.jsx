import React, { useState, useEffect } from "react";
import axios from "axios";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const generateWeek = (startDate) => {
	const week = [];
	const current = new Date(startDate);
	for (let i = 0; i < 7; i++) {
		week.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}
	return week;
};

const Calendar = () => {
	const [week, setWeek] = useState(generateWeek(new Date()));
	const [events, setEvents] = useState([]);

	// Данные для добавления события
	const [newEvent, setNewEvent] = useState({
		title: "",
		date: null,
		time: "",
		duration: 0,
	});

	// Данные для редактирования события
	const [editingEvent, setEditingEvent] = useState(null);
	// Управляем видимостью попапа для редактирования
	const [showEditModal, setShowEditModal] = useState(false);

	useEffect(() => {
		fetchEvents();
	}, [week]);

	const fetchEvents = async () => {
		try {
			const response = await axios.get("http://localhost:5000/api/events");
			setEvents(response.data);
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

	const addEvent = async () => {
		if (
			!newEvent.title ||
			!newEvent.date ||
			!newEvent.time ||
			newEvent.duration <= 0
		)
			return;

		try {
			await axios.post("http://localhost:5000/api/events", newEvent);
			fetchEvents();
			setNewEvent({ title: "", date: null, time: "", duration: 0 });
		} catch (error) {
			console.error("Error adding event:", error);
		}
	};

	// Функция обновления события
	const updateEvent = async () => {
		if (
			!editingEvent ||
			!editingEvent.title ||
			!editingEvent.date ||
			!editingEvent.time ||
			editingEvent.duration <= 0
		)
			return;

		try {
			await axios.put(
				`http://localhost:5000/api/events/${editingEvent.id}`,
				editingEvent
			);
			fetchEvents();
			setEditingEvent(null);
			setShowEditModal(false); // Закрываем модалку после сохранения
		} catch (error) {
			console.error("Error updating event:", error);
		}
	};

	const deleteEvent = async (id) => {
		try {
			await axios.delete(`http://localhost:5000/api/events/${id}`);
			fetchEvents();
		} catch (error) {
			console.error("Error deleting event:", error);
		}
	};

	const changeWeek = (direction) => {
		const newStartDate = new Date(week[0]);
		newStartDate.setDate(newStartDate.getDate() + direction * 7);
		setWeek(generateWeek(newStartDate));
	};

	// Открыть попап для редактирования (устанавливаем editingEvent и showEditModal)
	const openEditModal = (event) => {
		setEditingEvent(event);
		setShowEditModal(true);
	};

	// Закрыть попап
	const closeEditModal = () => {
		setEditingEvent(null);
		setShowEditModal(false);
	};

	return (
		<div className="p-4 max-w-6xl mx-auto">
			{/* Header */}
			<header className="flex items-center justify-between mb-4">
				<button
					onClick={() => changeWeek(-1)}
					className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
					Previous Week
				</button>
				<h1 className="text-xl font-semibold">
					{week[0].toLocaleDateString()} - {week[6].toLocaleDateString()}
				</h1>
				<button
					onClick={() => changeWeek(1)}
					className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
					Next Week
				</button>
			</header>

			{/* Grid Header */}
			<div className="grid grid-cols-8 border-t border-l">
				<div className="bg-gray-100 border-r border-b p-2 text-center font-bold">
					Time
				</div>
				{week.map((day, index) => (
					<div
						key={index}
						className="bg-gray-100 border-r border-b p-2 text-center font-bold">
						{daysOfWeek[day.getDay()]} {day.getDate()}/{day.getMonth() + 1}
					</div>
				))}
			</div>

			{/* Grid Body */}
			<div className="grid grid-cols-8">
				{/* Time Column */}
				<div className="border-t border-l">
					{hours.map((hour, index) => (
						<div
							key={index}
							className="border-b border-r p-2 text-center text-sm text-gray-600 h-16 flex items-center justify-center">
							{hour}
						</div>
					))}
				</div>

				{/* Days Columns */}
				{week.map((day, dayIndex) => (
					<div key={dayIndex} className="border-t border-l">
						{hours.map((hour, hourIndex) => (
							<div
								key={hourIndex}
								className="relative border-b border-r h-16 flex flex-col">
								{events
									.filter(
										(event) =>
											new Date(event.date).toDateString() ===
												day.toDateString() &&
											event.time.startsWith(hour.split(":")[0])
									)
									.map((event, eventIndex) => (
										<div
											key={eventIndex}
											className="absolute top-1 left-1 right-1 bg-blue-500 text-white text-xs rounded px-2 py-1 flex justify-between items-center cursor-pointer"
											// При клике открываем попап
											onClick={() => openEditModal(event)}>
											<span>
												{event.title} ({event.duration} mins)
											</span>
											{/* Кнопку Delete оставляем, если нужно */}
											<button
												onClick={(e) => {
													e.stopPropagation(); // чтобы не всплывало событие клика
													deleteEvent(event.id);
												}}
												className="text-red-300 hover:text-red-500 ml-2">
												X
											</button>
										</div>
									))}
							</div>
						))}
					</div>
				))}
			</div>

			{/* ---- Блок для добавления нового события (остался как есть) ---- */}
			<div className="mt-4 p-4 bg-gray-50 border rounded">
				<h2 className="text-lg font-semibold mb-2">Add Event</h2>
				<input
					type="text"
					value={newEvent.title}
					onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
					placeholder="Event title"
					className="p-2 border rounded w-full mb-2"
				/>
				<input
					type="date"
					value={newEvent.date || ""}
					onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
					className="p-2 border rounded w-full mb-2"
				/>
				<input
					type="time"
					value={newEvent.time}
					onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
					className="p-2 border rounded w-full mb-2"
				/>
				<input
					type="number"
					value={newEvent.duration}
					onChange={(e) =>
						setNewEvent({
							...newEvent,
							duration: parseInt(e.target.value, 10),
						})
					}
					placeholder="Duration (mins)"
					className="p-2 border rounded w-full mb-2"
				/>
				<button
					onClick={addEvent}
					className="px-4 py-2 bg-blue-500 text-white rounded">
					Add Event
				</button>
			</div>

			{/* ---- Модальное окно для редактирования события ---- */}
			{showEditModal && editingEvent && (
				<div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white p-6 rounded shadow-md relative w-full max-w-md">
						<h2 className="text-xl font-semibold mb-4">Edit Event</h2>
						{/* Закрывающая крестик-кнопка (по желанию) */}
						<button
							className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
							onClick={closeEditModal}>
							✕
						</button>
						{/* Форма редактирования */}
						<input
							type="text"
							value={editingEvent.title}
							onChange={(e) =>
								setEditingEvent({ ...editingEvent, title: e.target.value })
							}
							placeholder="Event title"
							className="p-2 border rounded w-full mb-2"
						/>
						<input
							type="date"
							value={editingEvent.date || ""}
							onChange={(e) =>
								setEditingEvent({ ...editingEvent, date: e.target.value })
							}
							className="p-2 border rounded w-full mb-2"
						/>
						<input
							type="time"
							value={editingEvent.time}
							onChange={(e) =>
								setEditingEvent({ ...editingEvent, time: e.target.value })
							}
							className="p-2 border rounded w-full mb-2"
						/>
						<input
							type="number"
							value={editingEvent.duration}
							onChange={(e) =>
								setEditingEvent({
									...editingEvent,
									duration: parseInt(e.target.value, 10),
								})
							}
							placeholder="Duration (mins)"
							className="p-2 border rounded w-full mb-2"
						/>
						{/* Кнопки управления */}
						<div className="flex justify-end">
							<button
								onClick={updateEvent}
								className="px-4 py-2 bg-blue-500 text-white rounded">
								Update
							</button>
							<button
								onClick={closeEditModal}
								className="ml-2 px-4 py-2 bg-gray-300 text-black rounded">
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendar;

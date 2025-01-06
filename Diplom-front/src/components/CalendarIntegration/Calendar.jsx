import React, { useState, useEffect } from "react";
import axios from "axios";

// Дни недели
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Генерируем 15-минутные интервалы (4 интервала в 1 час, всего 24*4=96)
const generateTimeSlots = () => {
	const slots = [];
	for (let hour = 0; hour < 24; hour++) {
		for (let quarter = 0; quarter < 4; quarter++) {
			const slot = hour + quarter * 0.25; // 0, 0.25, 0.5, 0.75, 1, ...
			slots.push(slot);
		}
	}
	return slots;
};
const timeSlots = generateTimeSlots(); // [0, 0.25, 0.5, 0.75, 1, 1.25, ...]

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

	// Модалка: для add/edit
	const [showModal, setShowModal] = useState(false);
	const [isEdit, setIsEdit] = useState(false);
	const [currentEvent, setCurrentEvent] = useState({
		id: null,
		title: "",
		startDate: "",
		endDate: "",
	});

	useEffect(() => {
		fetchEvents();
	}, [week]);

	const fetchEvents = async () => {
		try {
			const res = await axios.get("http://localhost:5000/api/events");
			setEvents(res.data);
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

	// Проверяем, покрывает ли событие конкретный 15-минутный слот
	const doesEventCoverSlot = (event, day, slot) => {
		// slot — десятичное число (например, 9.5 = 9:30)
		// Нам нужно получить реальное время в ms для day + slot
		const startOfDay = new Date(
			day.getFullYear(),
			day.getMonth(),
			day.getDate(),
			0,
			0,
			0,
			0
		).getTime();

		const slotMillis = startOfDay + slot * 3600000; // slot часов в мс
		const evStart = new Date(event.startDate).getTime();
		const evEnd = new Date(event.endDate).getTime();

		// Считаем, что интервал [evStart, evEnd) покрывает slot, если
		// slotMillis >= evStart && slotMillis < evEnd
		return slotMillis >= evStart && slotMillis < evEnd;
	};

	// Для текущего дня и слота ищем все события, которые его покрывают
	const getCoveringEvents = (day, slot) => {
		return events.filter((event) => {
			// Проверяем, совпадает ли дата начала события с этим днём (упрощённо)
			// В реальном календаре можно проверить не только dayStart, но и пересечение если событие переходит на др. день.
			// Для простоты возьмём «если event хоть как-то попадает в этот day»:
			const dayStart = new Date(day);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(day);
			dayEnd.setHours(23, 59, 59, 999);

			const eStart = new Date(event.startDate).getTime();
			const eEnd = new Date(event.endDate).getTime();

			// Проверяем, пересекается ли событие с этим днём вообще
			const inThisDay = eEnd > dayStart.getTime() && eStart < dayEnd.getTime();
			if (!inThisDay) return false;

			// А теперь проверим сам слот
			return doesEventCoverSlot(event, day, slot);
		});
	};

	// Открыть модалку для добавления
	const openAddModal = (day, slot) => {
		// Вычислим startDate как day + slot
		const startOfDay = new Date(
			day.getFullYear(),
			day.getMonth(),
			day.getDate(),
			0,
			0,
			0,
			0
		).getTime();

		const slotMillis = startOfDay + slot * 3600000;

		// По умолчанию сделаем событие на 15 минут
		// (т. е. [slot, slot + 0.25])
		const endMillis = slotMillis + 15 * 60000; // +15 минут

		const startDate = new Date(slotMillis);
		const endDate = new Date(endMillis);

		setCurrentEvent({
			id: null,
			title: "",
			startDate: startDate.toISOString().slice(0, 16),
			endDate: endDate.toISOString().slice(0, 16),
		});
		setIsEdit(false);
		setShowModal(true);
	};

	// Открыть модалку для редактирования (берём конкретный event)
	const openEditModal = (event) => {
		setCurrentEvent({
			id: event.id,
			title: event.title,
			// event.startDate уже в формате YYYY-MM-DDTHH:mm:ss...
			// для <input type="datetime-local"> удобнее обрезать до минуты
			startDate: event.startDate.slice(0, 16),
			endDate: event.endDate.slice(0, 16),
		});
		setIsEdit(true);
		setShowModal(true);
	};

	// Закрыть модалку
	const closeModal = () => {
		setShowModal(false);
		setIsEdit(false);
		setCurrentEvent({
			id: null,
			title: "",
			startDate: "",
			endDate: "",
		});
	};

	// Сохранить (Add или Update)
	const saveEvent = async () => {
		if (!currentEvent.title || !currentEvent.startDate || !currentEvent.endDate)
			return;

		if (!isEdit) {
			// Create
			try {
				await axios.post("http://localhost:5000/api/events", {
					title: currentEvent.title,
					startDate: currentEvent.startDate,
					endDate: currentEvent.endDate,
				});
				fetchEvents();
				closeModal();
			} catch (error) {
				console.error("Error creating event:", error);
			}
		} else {
			// Update
			try {
				await axios.put(`http://localhost:5000/api/events/${currentEvent.id}`, {
					title: currentEvent.title,
					startDate: currentEvent.startDate,
					endDate: currentEvent.endDate,
				});
				fetchEvents();
				closeModal();
			} catch (error) {
				console.error("Error updating event:", error);
			}
		}
	};

	// Удалить
	const deleteEvent = async () => {
		if (!currentEvent.id) return;
		try {
			await axios.delete(`http://localhost:5000/api/events/${currentEvent.id}`);
			fetchEvents();
			closeModal();
		} catch (error) {
			console.error("Error deleting event:", error);
		}
	};

	// Сменить неделю
	const changeWeek = (direction) => {
		const newStart = new Date(week[0]);
		newStart.setDate(newStart.getDate() + direction * 7);
		setWeek(generateWeek(newStart));
	};

	return (
		<div className="p-4 max-w-6xl mx-auto w-full">
			{/* Заголовок (переключение недель) */}
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

			{/* Шапка сетки (дни недели) */}
			<div className="grid grid-cols-8 border-t border-l">
				<div className="bg-gray-100 border-r border-b p-2 text-center font-bold">
					Time
				</div>
				{week.map((day, i) => (
					<div
						key={i}
						className="bg-gray-100 border-r border-b p-2 text-center font-bold">
						{daysOfWeek[day.getDay()]} {day.getDate()}/{day.getMonth() + 1}
					</div>
				))}
			</div>

			{/* Тело календаря: 7 колонок * 96 (по 15 мин) */}
			<div className="grid grid-cols-8">
				{/* Левая колонка (время) */}
				<div className="border-t border-l">
					{timeSlots.map((slotValue, idx) => {
						const hour = Math.floor(slotValue);
						const minute = Math.floor((slotValue - hour) * 60);
						return (
							<div
								key={idx}
								className="border-b border-r text-center text-sm text-gray-600 h-4 flex items-center justify-center"
								style={{ fontSize: "0.7rem" }}>
								{hour.toString().padStart(2, "0")}:
								{minute.toString().padStart(2, "0")}
							</div>
						);
					})}
				</div>

				{/* 7 колонок (каждый день) */}
				{week.map((day, dayIndex) => (
					<div key={dayIndex} className="border-t border-l">
						{timeSlots.map((slotValue, slotIndex) => {
							const coveringEvents = getCoveringEvents(day, slotValue);

							// Если хотя бы одно событие покрывает — закрашиваем
							const covered = coveringEvents.length > 0;

							return (
								<div
									key={slotIndex}
									className={`border-b border-r h-4 relative hover:bg-gray-100 cursor-pointer ${
										covered ? "bg-blue-300" : ""
									}`}
									onClick={() => {
										if (covered) {
											// Для примера берём только первое событие
											openEditModal(coveringEvents[0]);
										} else {
											openAddModal(day, slotValue);
										}
									}}
								/>
							);
						})}
					</div>
				))}
			</div>

			{/* Модальное окно (Add/Edit) */}
			{showModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
					<div className="bg-white p-6 rounded shadow-md relative w-full max-w-md">
						<h2 className="text-xl font-semibold mb-4">
							{isEdit ? "Edit Event" : "Add Event"}
						</h2>
						<button
							className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
							onClick={closeModal}>
							✕
						</button>
						{/* Форма */}
						<input
							type="text"
							value={currentEvent.title}
							onChange={(e) =>
								setCurrentEvent({ ...currentEvent, title: e.target.value })
							}
							placeholder="Event Title"
							className="p-2 border rounded w-full mb-2"
						/>

						<label className="text-sm text-gray-600">Start:</label>
						<input
							type="datetime-local"
							value={currentEvent.startDate}
							onChange={(e) =>
								setCurrentEvent({
									...currentEvent,
									startDate: e.target.value,
								})
							}
							className="p-2 border rounded w-full mb-2"
						/>

						<label className="text-sm text-gray-600">End:</label>
						<input
							type="datetime-local"
							value={currentEvent.endDate}
							onChange={(e) =>
								setCurrentEvent({
									...currentEvent,
									endDate: e.target.value,
								})
							}
							className="p-2 border rounded w-full mb-2"
						/>

						<div className="flex justify-end mt-4">
							<button
								onClick={saveEvent}
								className="px-4 py-2 bg-blue-500 text-white rounded">
								{isEdit ? "Update" : "Create"}
							</button>
							{isEdit && (
								<button
									onClick={deleteEvent}
									className="ml-2 px-4 py-2 bg-red-500 text-white rounded">
									Delete
								</button>
							)}
							<button
								onClick={closeModal}
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

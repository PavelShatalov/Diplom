import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDrag, useDrop } from "react-dnd";

//
// ---------- КОНСТАНТЫ ----------
//
const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DRAG_TYPE = "CALENDAR_EVENT";

// Для Day/Week раскладки (15-мин слоты)
const SLOT_HEIGHT = 16;
const SLOTS_PER_HOUR = 4;
const HOURS_PER_DAY = 24;
const TOTAL_SLOTS = HOURS_PER_DAY * SLOTS_PER_HOUR; // 96 слотов по 15 минут
const DAY_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT; // высота столбца (1536px)

// Генерация массива для 7-дневного диапазона (Week)
const generateWeek = (startDate) => {
	const week = [];
	const current = new Date(startDate);
	for (let i = 0; i < 7; i++) {
		week.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}
	return week;
};

// Генерация массива для месячной сетки (6 строк * 7 дней = 42 ячейки)
const generateMonthMatrix = (year, month) => {
	// 1-е число месяца
	const firstDay = new Date(year, month, 1);
	// Какой день недели у первого дня (0 - воскресенье, 1 - понедельник, ...)
	const startDay = firstDay.getDay();

	// Сколько дней в месяце
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	// Массив из 6 строк по 7 дней
	const matrix = [];
	// Смещаемся назад на `startDay`, чтобы первая ячейка в календаре была «всегда» воскресеньем (или другим первым днём)
	let currentDate = new Date(year, month, 1 - startDay);

	for (let row = 0; row < 6; row++) {
		const rowArr = [];
		for (let col = 0; col < 7; col++) {
			rowArr.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}
		matrix.push(rowArr);
	}

	return matrix;
};

const Calendar = () => {
	// viewMode: 'day' | 'week' | 'month'
	const [viewMode, setViewMode] = useState("week");

	// Для day/week
	const [currentStartDate, setCurrentStartDate] = useState(() => {
		// начало текущего дня (полночь)
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	});

	// Для month
	const [currentMonthYear, setCurrentMonthYear] = useState(() => {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() };
	});

	const [events, setEvents] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [isEdit, setIsEdit] = useState(false);
	const [currentEvent, setCurrentEvent] = useState({
		id: null,
		title: "",
		startDate: "",
		endDate: "",
	});

	// Подгружаем события заново при смене режима/дат
	useEffect(() => {
		fetchEvents();
	}, [viewMode, currentStartDate, currentMonthYear]);

	const fetchEvents = async () => {
		try {
			const res = await axios.get("http://localhost:5000/api/events");
			setEvents(res.data);
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

	// --- Переключение между режимами ---
	const handleViewChange = (mode) => {
		setViewMode(mode);
	};

	// --- Нажатие кнопок вперёд/назад (день/неделя/месяц) ---
	const goPrevious = () => {
		if (viewMode === "day") {
			const d = new Date(currentStartDate);
			d.setDate(d.getDate() - 1);
			setCurrentStartDate(d);
		} else if (viewMode === "week") {
			const d = new Date(currentStartDate);
			d.setDate(d.getDate() - 7);
			setCurrentStartDate(d);
		} else if (viewMode === "month") {
			let { year, month } = currentMonthYear;
			month--;
			if (month < 0) {
				year--;
				month = 11;
			}
			setCurrentMonthYear({ year, month });
		}
	};

	const goNext = () => {
		if (viewMode === "day") {
			const d = new Date(currentStartDate);
			d.setDate(d.getDate() + 1);
			setCurrentStartDate(d);
		} else if (viewMode === "week") {
			const d = new Date(currentStartDate);
			d.setDate(d.getDate() + 7);
			setCurrentStartDate(d);
		} else if (viewMode === "month") {
			let { year, month } = currentMonthYear;
			month++;
			if (month > 11) {
				year++;
				month = 0;
			}
			setCurrentMonthYear({ year, month });
		}
	};

	// --- Открыть модалку для Add ---
	const openAddModal = (startDate) => {
		const endDate = new Date(startDate.getTime() + 15 * 60_000); // +15 минут
		setCurrentEvent({
			id: null,
			title: "",
			startDate: startDate.toISOString().slice(0, 16),
			endDate: endDate.toISOString().slice(0, 16),
		});
		setIsEdit(false);
		setShowModal(true);
	};

	// --- Открыть модалку для Edit ---
	const openEditModal = (ev) => {
		setCurrentEvent({
			id: ev.id,
			title: ev.title,
			startDate: ev.startDate.slice(0, 16),
			endDate: ev.endDate.slice(0, 16),
		});
		setIsEdit(true);
		setShowModal(true);
	};

	// --- Закрыть модалку ---
	const closeModal = () => {
		setShowModal(false);
		setIsEdit(false);
		setCurrentEvent({ id: null, title: "", startDate: "", endDate: "" });
	};

	// --- Сохранить (Add / Update) ---
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

	// --- Удалить ---
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

	//
	// ---------- VIEW: DAY ----------
	//
	const renderDayView = () => {
		const day = currentStartDate;
		return (
			<div className="flex">
				{/* Левая колонка с часами */}
				<div
					className="border-t border-l relative"
					style={{ height: DAY_HEIGHT }}>
					{Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => {
						const topPx = slotIndex * SLOT_HEIGHT;
						const isHourStart = slotIndex % 4 === 0;
						const hour = Math.floor(slotIndex / 4);
						const minute = (slotIndex % 4) * 15;
						// 24h формат
						const label = `${String(hour).padStart(2, "0")}:${String(
							minute
						).padStart(2, "0")}`;

						return (
							<div
								key={slotIndex}
								className="absolute left-0 right-0 border-b border-gray-300"
								style={{
									top: `${topPx}px`,
									height: SLOT_HEIGHT,
									backgroundColor: isHourStart ? "#f0f0f0" : "transparent",
								}}>
								{isHourStart && (
									<div
										className="absolute left-0 text-xs text-gray-700"
										style={{ transform: "translateX(-100%)" }}>
										{label}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* Правая колонка: слоты + события */}
				<div
					className="border-t border-l relative"
					style={{ height: DAY_HEIGHT, flex: 1 }}>
					{/* Слоты (DropTargets) */}
					{Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
						<CalendarSlot
							key={slotIndex}
							slotIndex={slotIndex}
							day={day}
							onAddEvent={openAddModal}
						/>
					))}

					{/* События дня */}
					<DayWeekEventsColumn
						day={day}
						events={events}
						openEditModal={openEditModal}
						fetchEvents={fetchEvents}
					/>
				</div>
			</div>
		);
	};

	//
	// ---------- VIEW: WEEK ----------
	//
	const renderWeekView = () => {
		// 7-дневный диапазон
		const weekDays = generateWeek(currentStartDate);

		return (
			<div className="grid grid-cols-8">
				{/* Левая колонка (часы) */}
				<div
					className="border-t border-l relative"
					style={{ height: DAY_HEIGHT }}>
					{Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => {
						const topPx = slotIndex * SLOT_HEIGHT;
						const isHourStart = slotIndex % 4 === 0;
						const hour = Math.floor(slotIndex / 4);
						const minute = (slotIndex % 4) * 15;
						const label = `${String(hour).padStart(2, "0")}:${String(
							minute
						).padStart(2, "0")}`;

						return (
							<div
								key={slotIndex}
								className="absolute left-0 right-0 border-b border-gray-300"
								style={{
									top: `${topPx}px`,
									height: SLOT_HEIGHT,
									backgroundColor: isHourStart ? "#f0f0f0" : "transparent",
								}}>
								{isHourStart && (
									<div
										className="absolute left-0 text-xs text-gray-700"
										style={{ transform: "translateX(-100%)" }}>
										{label}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* 7 столбцов (дни) */}
				{weekDays.map((day, i) => (
					<div
						key={i}
						className="border-t border-l relative"
						style={{ height: DAY_HEIGHT }}>
						{/* Сетка (слоты) */}
						{Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
							<CalendarSlot
								key={slotIndex}
								slotIndex={slotIndex}
								day={day}
								onAddEvent={openAddModal}
							/>
						))}

						{/* События для данного дня */}
						<DayWeekEventsColumn
							day={day}
							events={events}
							openEditModal={openEditModal}
							fetchEvents={fetchEvents}
						/>
					</div>
				))}
			</div>
		);
	};

	//
	// ---------- VIEW: MONTH ----------
	//
	const renderMonthView = () => {
		const { year, month } = currentMonthYear;
		const matrix = generateMonthMatrix(year, month);

		const monthName = new Date(year, month, 1).toLocaleString("default", {
			month: "long",
		});

		return (
			<div>
				<h2 className="text-xl font-semibold mb-2">
					{monthName} {year}
				</h2>

				<div className="grid grid-cols-7 border-t border-l">
					{/* Заголовки дней недели */}
					{daysOfWeekShort.map((dow) => (
						<div
							key={dow}
							className="bg-gray-100 border-r border-b p-2 text-center font-bold">
							{dow}
						</div>
					))}
				</div>

				{/* Сетка с днями */}
				<div className="grid grid-cols-7 border-l border-t">
					{matrix.map((row, rowIdx) =>
						row.map((cellDate, colIdx) => {
							const cellDay = cellDate.getDate();
							const cellMonth = cellDate.getMonth();
							const cellYear = cellDate.getFullYear();

							const dayStart = new Date(
								cellYear,
								cellMonth,
								cellDay,
								0,
								0,
								0,
								0
							).getTime();
							const dayEnd = new Date(
								cellYear,
								cellMonth,
								cellDay,
								23,
								59,
								59,
								999
							).getTime();

							// Фильтруем события, пересекающиеся с этим днём
							const cellEvents = events.filter((ev) => {
								const evStart = new Date(ev.startDate).getTime();
								const evEnd = new Date(ev.endDate).getTime();
								return evEnd >= dayStart && evStart <= dayEnd;
							});

							const isCurrentMonth = cellMonth === month;

							return (
								<div
									key={`${rowIdx}-${colIdx}`}
									className={`border-b border-r p-1 h-24 text-xs relative ${
										isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
									}`}
									onClick={(e) => {
										e.stopPropagation();
										const newStart = new Date(
											cellYear,
											cellMonth,
											cellDay,
											10,
											0
										);
										openAddModal(newStart);
									}}>
									{/* Номер дня */}
									<div className="font-semibold">{cellDay}</div>
									{/* Список событий */}
									<div className="mt-1 space-y-1">
										{cellEvents.map((ev) => (
											<div
												key={ev.id}
												className="bg-blue-500 text-white rounded px-1 truncate cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													openEditModal(ev);
												}}>
												{ev.title}
											</div>
										))}
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		);
	};

	//
	// ---------- РЕНДЕР ----------
	//
	return (
		<div className="p-4 max-w-6xl mx-auto w-full">
			{/* Шапка (выбор режима) */}
			<div className="flex items-center justify-between mb-4">
				<div>
					<button
						className={`px-3 py-1 mr-2 rounded ${
							viewMode === "day" ? "bg-blue-300" : "bg-gray-200"
						}`}
						onClick={() => handleViewChange("day")}>
						Day
					</button>
					<button
						className={`px-3 py-1 mr-2 rounded ${
							viewMode === "week" ? "bg-blue-300" : "bg-gray-200"
						}`}
						onClick={() => handleViewChange("week")}>
						Week
					</button>
					<button
						className={`px-3 py-1 rounded ${
							viewMode === "month" ? "bg-blue-300" : "bg-gray-200"
						}`}
						onClick={() => handleViewChange("month")}>
						Month
					</button>
				</div>

				<div className="flex space-x-2">
					<button
						onClick={goPrevious}
						className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
						Previous
					</button>
					<button
						onClick={goNext}
						className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
						Next
					</button>
				</div>
			</div>

			{/* Основная область (Day / Week / Month) */}
			{viewMode === "day" && renderDayView()}
			{viewMode === "week" && renderWeekView()}
			{viewMode === "month" && renderMonthView()}

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

						<input
							type="text"
							value={currentEvent.title}
							onChange={(e) =>
								setCurrentEvent({ ...currentEvent, title: e.target.value })
							}
							placeholder="Event Title"
							className="p-2 border rounded w-full mb-2"
						/>
						<label className="text-sm text-gray-600">Start (24h):</label>
						<input
							type="datetime-local"
							value={currentEvent.startDate}
							onChange={(e) =>
								setCurrentEvent({ ...currentEvent, startDate: e.target.value })
							}
							className="p-2 border rounded w-full mb-2"
						/>
						<label className="text-sm text-gray-600">End (24h):</label>
						<input
							type="datetime-local"
							value={currentEvent.endDate}
							onChange={(e) =>
								setCurrentEvent({ ...currentEvent, endDate: e.target.value })
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

//
// ---------- CalendarSlot ----------
// 15-минутная ячейка, DropTarget для Day/Week
//
function CalendarSlot({ slotIndex, day, onAddEvent }) {
	// Drag & Drop target
	const [{ isOver }, dropRef] = useDrop({
		accept: DRAG_TYPE,
		drop: (item) => {
			return { day, slotIndex };
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	});

	const topPx = slotIndex * SLOT_HEIGHT;
	const background = isOver ? "rgba(0, 150, 255, 0.2)" : "transparent";

	return (
		<div
			ref={dropRef}
			className="absolute left-0 right-0 border-b border-gray-300 cursor-pointer"
			style={{
				top: topPx,
				height: SLOT_HEIGHT,
				backgroundColor: background,
			}}
			onClick={(e) => {
				e.stopPropagation();
				// Создаём событие (Add)
				const slotDate = new Date(day);
				slotDate.setHours(0, 0, 0, 0);
				slotDate.setTime(slotDate.getTime() + slotIndex * 15 * 60000);
				onAddEvent(slotDate);
			}}
		/>
	);
}

//
// ---------- DayWeekEventsColumn ----------
// Раскладывает и рендерит события внутри одного дня.
// Если событие пересекает день, "обрезаем" его по границе (00:00..23:59).
//
function DayWeekEventsColumn({ day, events, openEditModal, fetchEvents }) {
	// Границы дня
	const dayStart = new Date(day);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(day);
	dayEnd.setHours(23, 59, 59, 999);

	// Отбираем только те события, которые пересекаются с этим днём
	// и "обрезаем" их по границе дня
	const dayEventBlocks = events
		.map((ev) => getEventPartForDay(ev, dayStart, dayEnd)) // вернёт "кусь" или null
		.filter(Boolean) // убираем null
		.map((partialEv) => {
			// Для упрощения, считаем top/height в слотах
			const evStart = new Date(partialEv.startDate);
			const evEnd = new Date(partialEv.endDate);

			const startSlot = Math.floor(
				(evStart.getHours() * 60 + evStart.getMinutes()) / 15
			);
			const endSlot = Math.ceil(
				(evEnd.getHours() * 60 + evEnd.getMinutes()) / 15
			);
			const safeStart = Math.max(0, startSlot);
			const safeEnd = Math.min(TOTAL_SLOTS, endSlot);

			return {
				...partialEv,
				topPx: safeStart * SLOT_HEIGHT,
				heightPx: (safeEnd - safeStart) * SLOT_HEIGHT,
				startMs: evStart.getTime(),
				endMs: evEnd.getTime(),
			};
		})
		.sort((a, b) => a.startMs - b.startMs);

	return (
		<>
			{dayEventBlocks.map((block) => (
				<EventBlock
					key={block.id}
					block={block}
					openEditModal={openEditModal}
					onUpdateEvent={(evId, newStartMs) => {
						// Сохраняем ту же длительность
						const duration = block.duration || 15;
						const newEndMs = newStartMs + duration * 60000;

						axios
							.put(`http://localhost:5000/api/events/${evId}`, {
								title: block.title,
								startDate: new Date(newStartMs).toISOString(),
								endDate: new Date(newEndMs).toISOString(),
							})
							.then(() => fetchEvents())
							.catch((err) => console.error(err));
					}}
				/>
			))}
		</>
	);
}

//
// ---------- Вспомогательная функция ----------
// Возвращает часть события, которая пересекает промежуток [dayStart..dayEnd].
// Если нет пересечения, вернёт null. Если есть, "обрежет" начало или конец.
function getEventPartForDay(event, dayStart, dayEnd) {
	const evStart = new Date(event.startDate);
	const evEnd = new Date(event.endDate);

	if (evEnd <= dayStart || evStart >= dayEnd) {
		return null; // не пересекается
	}

	const overlapStart = evStart < dayStart ? dayStart : evStart;
	const overlapEnd = evEnd > dayEnd ? dayEnd : evEnd;

	return {
		...event,
		startDate: overlapStart,
		endDate: overlapEnd,
	};
}

//
// ---------- EventBlock ----------
// DragSource + клик для Edit
//
function EventBlock({ block, openEditModal, onUpdateEvent }) {
	const [{ isDragging }, dragRef] = useDrag({
		type: DRAG_TYPE,
		item: {
			id: block.id,
			originalStart: block.startMs,
		},
		end: (item, monitor) => {
			const dropResult = monitor.getDropResult();
			if (item && dropResult) {
				// dropResult = { day, slotIndex }
				const { day, slotIndex } = dropResult;
				const dayCopy = new Date(day);
				dayCopy.setHours(0, 0, 0, 0);
				const newStartMs = dayCopy.getTime() + slotIndex * 15 * 60000;
				onUpdateEvent(item.id, newStartMs);
			}
		},
		collect: (monitor) => ({
			isDragging: !!monitor.isDragging(),
		}),
	});

	const opacity = isDragging ? 0.5 : 1;

	// Форматируем время для отображения
	const startTimeStr = new Date(block.startDate).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const endTimeStr = new Date(block.endDate).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	return (
		<div
			ref={dragRef}
			className="absolute bg-blue-500 text-white text-xs rounded px-1 py-1 cursor-pointer shadow-md"
			style={{
				top: block.topPx,
				left: "5%",
				width: "90%",
				height: block.heightPx,
				opacity,
			}}
			onClick={(e) => {
				e.stopPropagation();
				openEditModal(block);
			}}>
			<div className="font-semibold truncate">{block.title}</div>
			<div className="text-[0.6rem]">
				{startTimeStr} - {endTimeStr}
			</div>
		</div>
	);
}

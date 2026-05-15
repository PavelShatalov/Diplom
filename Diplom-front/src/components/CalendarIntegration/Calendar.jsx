import React, { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../AuthContext";
import { CalendarHeader } from "./CalendarHeader";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { IntegrationPanel } from "./IntegrationPanel";
import { eventColors, formatDateTimeLocal } from "./helpers";

const Calendar = () => {
	const { authAxios } = useContext(AuthContext);

	// viewMode: 'day' | 'week' | 'month'
	const [viewMode, setViewMode] = useState("week");

	// Для day/week
	const [currentStartDate, setCurrentStartDate] = useState(() => {
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
		reminderMinutes: 15,
		source: "local",
		color: eventColors[0],
	});

	const fetchEvents = useCallback(async () => {
		try {
			const res = await authAxios.get("/events");
			const eventsWithId = res.data.map((ev) => ({
				...ev,
				id: ev._id,
				startDate: new Date(ev.startDate).toISOString(),
				endDate: new Date(ev.endDate).toISOString(),
				reminderMinutes: ev.reminderMinutes ?? 15,
				source: ev.source || "local",
				syncStatus: ev.syncStatus || "local",
				color: ev.color || eventColors[0],
			}));
			setEvents(eventsWithId);
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	}, [authAxios]);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents, viewMode, currentStartDate, currentMonthYear]);

	const handleViewChange = (mode) => setViewMode(mode);

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

	const goToday = () => {
		const now = new Date();
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);

		if (viewMode === "month") {
			setCurrentMonthYear({
				year: now.getFullYear(),
				month: now.getMonth(),
			});
		} else {
			setCurrentStartDate(today);
		}
	};

	// Open add
	const openAddModal = (startDate) => {
		const endDate = new Date(startDate.getTime() + 15 * 60000);
		setCurrentEvent({
			id: null,
			title: "",
			startDate: formatDateTimeLocal(startDate),
			endDate: formatDateTimeLocal(endDate),
			reminderMinutes: 15,
			source: "local",
			color: eventColors[0],
		});
		setIsEdit(false);
		setShowModal(true);
	};

	// Open edit
	const openEditModal = (ev) => {
		setCurrentEvent({
			id: ev.id,
			title: ev.title,
			startDate: formatDateTimeLocal(ev.startDate),
			endDate: formatDateTimeLocal(ev.endDate),
			reminderMinutes: ev.reminderMinutes ?? 15,
			source: ev.source || "local",
			color: ev.color || eventColors[0],
		});
		console.log({
			id: ev.id,
			title: ev.title,
			startDate: formatDateTimeLocal(ev.startDate),
			endDate: formatDateTimeLocal(ev.endDate),
		});
		setIsEdit(true);
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setIsEdit(false);
		setCurrentEvent({
			id: null,
			title: "",
			startDate: "",
			endDate: "",
			reminderMinutes: 15,
			source: "local",
			color: eventColors[0],
		});
	};

	const saveEvent = async () => {
		if (
			!currentEvent.title ||
			!currentEvent.startDate ||
			!currentEvent.endDate
		) {
			return;
		}
		if (!isEdit) {
			// Create
			try {
				await authAxios.post("/events", {
					title: currentEvent.title,
					startDate: currentEvent.startDate,
					endDate: currentEvent.endDate,
					reminderMinutes: currentEvent.reminderMinutes,
					source: currentEvent.source,
					color: currentEvent.color,
				});
				fetchEvents();
				closeModal();
			} catch (error) {
				console.error("Error creating event:", error);
			}
		} else {
			// Update
			try {
				await authAxios.put(`/events/${currentEvent.id}`, {
					title: currentEvent.title,
					startDate: currentEvent.startDate,
					endDate: currentEvent.endDate,
					reminderMinutes: currentEvent.reminderMinutes,
					source: currentEvent.source,
					color: currentEvent.color,
				});
				setEvents((previousEvents) =>
					previousEvents.map((event) =>
						event.id === currentEvent.id
							? {
									...event,
									title: currentEvent.title,
									startDate: new Date(currentEvent.startDate).toISOString(),
									endDate: new Date(currentEvent.endDate).toISOString(),
									reminderMinutes: currentEvent.reminderMinutes,
									source: currentEvent.source,
									color: currentEvent.color,
							  }
							: event
					)
				);
				fetchEvents();
				closeModal();
			} catch (error) {
				console.error("Error updating event:", error);
			}
		}
	};

	const deleteEvent = async () => {
		if (!currentEvent.id) return;
		try {
			await authAxios.delete(`/events/${currentEvent.id}`);
			fetchEvents();
			closeModal();
		} catch (error) {
			console.error("Error deleting event:", error);
			alert("Ошибка при удалении события.");
		}
	};

	const renderDay = () => (
		<DayView
			currentStartDate={currentStartDate}
			events={events}
			openAddModal={openAddModal}
			openEditModal={openEditModal}
			fetchEvents={fetchEvents}
		/>
	);

	const renderWeek = () => (
		<WeekView
			currentStartDate={currentStartDate}
			events={events}
			openAddModal={openAddModal}
			openEditModal={openEditModal}
			fetchEvents={fetchEvents}
		/>
	);

	const renderMonth = () => (
		<MonthView
			currentMonthYear={currentMonthYear}
			events={events}
			openAddModal={openAddModal}
			openEditModal={openEditModal}
		/>
	);

	return (
		<div className="p-4 max-w-6xl mx-auto w-full">
			<IntegrationPanel />

			<CalendarHeader
				viewMode={viewMode}
				onViewChange={handleViewChange}
				onPrevious={goPrevious}
				onToday={goToday}
				onNext={goNext}
				currentMonthYear={currentMonthYear}
				currentStartDate={currentStartDate}
			/>

			{viewMode === "day" && renderDay()}
			{viewMode === "week" && renderWeek()}
			{viewMode === "month" && renderMonth()}

			{showModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-slate-900 bg-opacity-45 z-50 px-4">
					<div className="bg-white p-6 rounded-lg shadow-xl relative w-full max-w-md border border-slate-200">
						<h2 className="text-lg font-semibold mb-4 text-slate-950">
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
							className="p-2 border border-slate-300 rounded w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<label className="text-sm font-medium text-slate-600">Start</label>
						<input
							type="datetime-local"
							value={currentEvent.startDate}
							onChange={(e) =>
								setCurrentEvent({ ...currentEvent, startDate: e.target.value })
							}
							className="p-2 border border-slate-300 rounded w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<label className="text-sm font-medium text-slate-600">End</label>
						<input
							type="datetime-local"
							value={currentEvent.endDate}
							onChange={(e) =>
								setCurrentEvent({ ...currentEvent, endDate: e.target.value })
							}
							className="p-2 border border-slate-300 rounded w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<label className="text-sm font-medium text-slate-600">Reminder</label>
						<select
							value={currentEvent.reminderMinutes}
							onChange={(e) =>
								setCurrentEvent({
									...currentEvent,
									reminderMinutes: Number(e.target.value),
								})
							}
							className="p-2 border border-slate-300 rounded w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
							<option value={0}>At event time</option>
							<option value={5}>5 minutes before</option>
							<option value={15}>15 minutes before</option>
							<option value={30}>30 minutes before</option>
							<option value={60}>1 hour before</option>
						</select>
						<label className="text-sm font-medium text-slate-600">Source</label>
						<select
							value={currentEvent.source}
							onChange={(e) =>
								setCurrentEvent({
									...currentEvent,
									source: e.target.value,
								})
							}
							className="p-2 border border-slate-300 rounded w-full mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
							<option value="local">Local</option>
							<option value="intranet">Intranet</option>
							<option value="google">Google Calendar</option>
							<option value="outlook">Outlook</option>
						</select>
						<label className="text-sm font-medium text-slate-600">Color</label>
						<div className="mt-2 mb-4 flex gap-2">
							{eventColors.map((color) => (
								<button
									key={color}
									type="button"
									aria-label={`Choose color ${color}`}
									onClick={() => setCurrentEvent({ ...currentEvent, color })}
									className={`h-7 w-7 rounded-full border-2 ${
										currentEvent.color === color
											? "border-slate-950"
											: "border-white"
									} shadow-sm ring-1 ring-slate-200`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>

						<div className="flex justify-end mt-4">
							<button
								onClick={saveEvent}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
								{isEdit ? "Update" : "Create"}
							</button>
							{isEdit && (
								<button
									onClick={deleteEvent}
									className="ml-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium">
									Delete
								</button>
							)}
							<button
								onClick={closeModal}
								className="ml-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded text-sm font-medium">
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

import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../AuthContext";
import { CalendarHeader } from "./CalendarHeader";
import { generateWeek, generateMonthMatrix } from "./helpers";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";

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
	});

	useEffect(() => {
		fetchEvents();
	}, [viewMode, currentStartDate, currentMonthYear]);

	const fetchEvents = async () => {
		try {
			const res = await authAxios.get("/events");
			setEvents(res.data);
		} catch (error) {
			console.error("Error fetching events:", error);
		}
	};

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

	// Open add
	const openAddModal = (startDate) => {
		const endDate = new Date(startDate.getTime() + 15 * 60000);
		setCurrentEvent({
			id: null,
			title: "",
			startDate: startDate.toISOString().slice(0, 16),
			endDate: endDate.toISOString().slice(0, 16),
		});
		setIsEdit(false);
		setShowModal(true);
	};

	// Open edit
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

	const closeModal = () => {
		setShowModal(false);
		setIsEdit(false);
		setCurrentEvent({ id: null, title: "", startDate: "", endDate: "" });
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
				});
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
			<CalendarHeader
				viewMode={viewMode}
				onViewChange={handleViewChange}
				onPrevious={goPrevious}
				onNext={goNext}
				currentMonthYear={currentMonthYear}
				currentStartDate={currentStartDate}
			/>

			{viewMode === "day" && renderDay()}
			{viewMode === "week" && renderWeek()}
			{viewMode === "month" && renderMonth()}

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

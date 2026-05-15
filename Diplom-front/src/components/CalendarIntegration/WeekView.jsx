import React from "react";
import { CalendarSlot } from "./CalendarSlot";
import { DayWeekEventsColumn } from "./DayWeekEventsColumn";
import {
	generateWeek,
	SLOT_HEIGHT,
	TOTAL_SLOTS,
	DAY_HEIGHT,
	daysOfWeekShort,
	TIME_GUTTER_WIDTH,
} from "./helpers";

export const WeekView = ({
	currentStartDate,
	events,
	openAddModal,
	openEditModal,
	fetchEvents,
}) => {
	const weekDays = generateWeek(currentStartDate);
	const gridColumns = `${TIME_GUTTER_WIDTH}px repeat(7, minmax(0, 1fr))`;

	const renderHeaderRow = () => (
		<div
			className="grid border border-slate-200 rounded-t-lg overflow-hidden bg-slate-50"
			style={{ gridTemplateColumns: gridColumns }}>
			<div className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
				Time
			</div>
			{weekDays.map((day, index) => {
				const weekday = daysOfWeekShort[day.getDay()];
				const dateNum = day.getDate();
				return (
					<div
						key={index}
						className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-700">
						{weekday} {dateNum}
					</div>
				);
			})}
		</div>
	);

	const renderTimeGutter = () => (
		<div
			className="relative bg-slate-50 border-r border-slate-200"
			style={{ height: DAY_HEIGHT, width: TIME_GUTTER_WIDTH }}>
			{Array.from({ length: 24 }).map((_, hour) => (
				<div
					key={hour}
					className="absolute right-3 text-[0.7rem] font-medium text-slate-500"
					style={{
						top: hour === 0 ? "10px" : `${hour * SLOT_HEIGHT * 4}px`,
						transform: hour === 0 ? "none" : "translateY(-50%)",
					}}>
					{String(hour).padStart(2, "0")}:00
				</div>
			))}
		</div>
	);

	return (
		<div className="w-full rounded-lg bg-white shadow-sm">
			{renderHeaderRow()}
			<div
				className="grid border-x border-b border-slate-200 rounded-b-lg overflow-hidden"
				style={{ gridTemplateColumns: gridColumns }}>
				{renderTimeGutter()}

				{weekDays.map((day, index) => (
					<div
						key={index}
						className="border-l border-slate-200 relative bg-white"
						style={{ height: DAY_HEIGHT }}>
						{Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
							<CalendarSlot
								key={slotIndex}
								slotIndex={slotIndex}
								day={day}
								onAddEvent={openAddModal}
							/>
						))}

						<DayWeekEventsColumn
							day={day}
							events={events}
							openEditModal={openEditModal}
							fetchEvents={fetchEvents}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

import React from "react";
import { CalendarSlot } from "./CalendarSlot";
import { DayWeekEventsColumn } from "./DayWeekEventsColumn";
import {
	SLOT_HEIGHT,
	TOTAL_SLOTS,
	DAY_HEIGHT,
	TIME_GUTTER_WIDTH,
} from "./helpers";

export const DayView = ({
	currentStartDate,
	events,
	openAddModal,
	openEditModal,
	fetchEvents,
}) => {
	const day = currentStartDate;

	return (
		<div className="w-full rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
			<div className="flex items-center justify-center border-b border-slate-200 bg-white">
				<h2 className="text-lg font-semibold text-slate-900 py-3">
					{day.toDateString()}
				</h2>
			</div>

			<div className="flex">
				<div
					className="relative shrink-0 bg-slate-50 border-r border-slate-200"
					style={{ height: DAY_HEIGHT, width: TIME_GUTTER_WIDTH }}>
					{Array.from({ length: 24 }).map((_, hour) => {
						const topPx = hour * SLOT_HEIGHT * 4;
						const label = `${String(hour).padStart(2, "0")}:00`;

						return (
							<div
								key={hour}
								className="absolute right-3 text-[0.7rem] font-medium text-slate-500"
								style={{
									top: hour === 0 ? "10px" : `${topPx}px`,
									transform: hour === 0 ? "none" : "translateY(-50%)",
								}}>
								{label}
							</div>
						);
					})}
				</div>

				{/* Правая колонка (слоты + события) */}
				<div
					className="relative"
					style={{ height: DAY_HEIGHT, flex: 1 }}>
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
			</div>
		</div>
	);
};

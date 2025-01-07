import React from "react";
import { CalendarSlot } from "./CalendarSlot";
import { DayWeekEventsColumn } from "./DayWeekEventsColumn";
import { SLOT_HEIGHT, TOTAL_SLOTS, DAY_HEIGHT } from "./helpers";

export const DayView = ({
	currentStartDate,
	events,
	openAddModal,
	openEditModal,
	fetchEvents,
}) => {
	const day = currentStartDate;

	return (
		<div className="w-full">
			{/* Заголовок: какой день */}
			<div className="flex items-center justify-center mb-2">
				<h2 className="text-lg font-semibold">{day.toDateString()}</h2>
			</div>

			<div className="flex">
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

				{/* Правая колонка (слоты + события) */}
				<div
					className="border-t border-l relative"
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

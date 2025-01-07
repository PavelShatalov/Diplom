import React from "react";
import { CalendarSlot } from "./CalendarSlot";
import { DayWeekEventsColumn } from "./DayWeekEventsColumn";
import {
	generateWeek,
	SLOT_HEIGHT,
	TOTAL_SLOTS,
	DAY_HEIGHT,
	daysOfWeekShort,
} from "./helpers";

export const WeekView = ({
	currentStartDate,
	events,
	openAddModal,
	openEditModal,
	fetchEvents,
}) => {
	const weekDays = generateWeek(currentStartDate);

	// Отдельный хедер: 8 колонок (Time + 7 дней)
	const renderHeaderRow = () => {
		return (
			<div className="grid grid-cols-8 border-t border-l">
				<div className="bg-gray-100 border-r border-b p-2 text-center font-bold">
					Time
				</div>
				{weekDays.map((day, index) => {
					const weekday = daysOfWeekShort[day.getDay()];
					const dateNum = day.getDate();
					return (
						<div
							key={index}
							className="bg-gray-100 border-r border-b p-2 text-center font-bold">
							{weekday} {dateNum}
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div className="w-full">
			{renderHeaderRow()}
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

				{/* 7 колонок (дни) */}
				{weekDays.map((day, i) => (
					<div
						key={i}
						className="border-t border-l relative"
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

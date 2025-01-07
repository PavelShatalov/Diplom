import React from "react";
import { daysOfWeekShort, generateMonthMatrix } from "./helpers";

export const MonthView = ({
	currentMonthYear,
	events,
	openAddModal,
	openEditModal,
}) => {
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
				{daysOfWeekShort.map((dow) => (
					<div
						key={dow}
						className="bg-gray-100 border-r border-b p-2 text-center font-bold">
						{dow}
					</div>
				))}
			</div>

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
								<div className="font-semibold">{cellDay}</div>
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

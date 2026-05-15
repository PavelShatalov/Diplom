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
		<div className="rounded-lg bg-white shadow-sm border border-slate-200 overflow-hidden">
			<h2 className="text-lg font-semibold px-4 py-3 text-slate-900">
				{monthName} {year}
			</h2>

			<div className="grid grid-cols-7 border-t border-slate-200 bg-slate-50">
				{daysOfWeekShort.map((dow) => (
					<div
						key={dow}
						className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-700">
						{dow}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 border-t border-slate-200">
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
								className={`border-b border-r border-slate-200 p-2 h-28 text-xs relative ${
									isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"
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
								<div className="font-semibold text-slate-700">{cellDay}</div>
								<div className="mt-1 space-y-1">
									{cellEvents.map((ev) => (
										<div
											key={ev.id}
											className="text-white rounded px-2 py-0.5 truncate cursor-pointer shadow-sm"
											style={{ backgroundColor: ev.color || "#2563eb" }}
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

import React from "react";

export const CalendarHeader = ({
	viewMode,
	onViewChange,
	onPrevious,
	onToday,
	onNext,
}) => {
	// Можно отформатировать название недели/дня/месяца
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
			<div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-1">
				<button
					className={`px-3 py-1.5 rounded text-sm font-medium ${
						viewMode === "day"
							? "bg-white text-blue-700 shadow-sm"
							: "text-slate-600 hover:text-slate-950"
					}`}
					onClick={() => onViewChange("day")}>
					Day
				</button>
				<button
					className={`px-3 py-1.5 rounded text-sm font-medium ${
						viewMode === "week"
							? "bg-white text-blue-700 shadow-sm"
							: "text-slate-600 hover:text-slate-950"
					}`}
					onClick={() => onViewChange("week")}>
					Week
				</button>
				<button
					className={`px-3 py-1.5 rounded text-sm font-medium ${
						viewMode === "month"
							? "bg-white text-blue-700 shadow-sm"
							: "text-slate-600 hover:text-slate-950"
					}`}
					onClick={() => onViewChange("month")}>
					Month
				</button>
			</div>

			<div className="flex space-x-2">
				<button
					onClick={onPrevious}
					className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-sm font-medium">
					Previous
				</button>
				<button
					onClick={onToday}
					className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white rounded text-sm font-medium">
					Today
				</button>
				<button
					onClick={onNext}
					className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-sm font-medium">
					Next
				</button>
			</div>
		</div>
	);
};

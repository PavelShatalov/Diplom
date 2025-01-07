import React from "react";

export const CalendarHeader = ({
	viewMode,
	onViewChange,
	onPrevious,
	onNext,
	currentMonthYear,
	currentStartDate,
}) => {
	// Можно отформатировать название недели/дня/месяца
	return (
		<div className="flex items-center justify-between mb-4">
			<div>
				<button
					className={`px-3 py-1 mr-2 rounded ${
						viewMode === "day" ? "bg-blue-300" : "bg-gray-200"
					}`}
					onClick={() => onViewChange("day")}>
					Day
				</button>
				<button
					className={`px-3 py-1 mr-2 rounded ${
						viewMode === "week" ? "bg-blue-300" : "bg-gray-200"
					}`}
					onClick={() => onViewChange("week")}>
					Week
				</button>
				<button
					className={`px-3 py-1 rounded ${
						viewMode === "month" ? "bg-blue-300" : "bg-gray-200"
					}`}
					onClick={() => onViewChange("month")}>
					Month
				</button>
			</div>

			<div className="flex space-x-2">
				<button
					onClick={onPrevious}
					className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
					Previous
				</button>
				<button
					onClick={onNext}
					className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
					Next
				</button>
			</div>
		</div>
	);
};

export const daysOfWeekShort = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
];

export const DRAG_TYPE = "CALENDAR_EVENT";

export const SLOT_HEIGHT = 16; // px на 15 минут
export const SLOTS_PER_HOUR = 4;
export const HOURS_PER_DAY = 24;
export const TOTAL_SLOTS = HOURS_PER_DAY * SLOTS_PER_HOUR; // 96
export const DAY_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT; // 1536

// Генерация недельного диапазона
export function generateWeek(startDate) {
	const arr = [];
	const current = new Date(startDate);
	for (let i = 0; i < 7; i++) {
		arr.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}
	return arr;
}

// Генерация матрицы (6x7) для месячного вида
export function generateMonthMatrix(year, month) {
	const firstDay = new Date(year, month, 1);
	const startDay = firstDay.getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const matrix = [];
	let currentDate = new Date(year, month, 1 - startDay);

	for (let row = 0; row < 6; row++) {
		const rowArr = [];
		for (let col = 0; col < 7; col++) {
			rowArr.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}
		matrix.push(rowArr);
	}
	return matrix;
}

// Возвращает часть события, пересекающую промежуток [dayStart..dayEnd].
export function getEventPartForDay(event, dayStart, dayEnd) {
	const evStart = new Date(event.startDate);
	const evEnd = new Date(event.endDate);

	if (evEnd <= dayStart || evStart >= dayEnd) {
		return null; // не пересекается
	}

	const overlapStart = evStart < dayStart ? dayStart : evStart;
	const overlapEnd = evEnd > dayEnd ? dayEnd : evEnd;

	return {
		...event,
		startDate: overlapStart.toISOString(), // Возвращаем строку
		endDate: overlapEnd.toISOString(),
	};
}

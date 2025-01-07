import React from "react";
import { useDrop } from "react-dnd";
import { DRAG_TYPE, SLOT_HEIGHT } from "./helpers";

export const CalendarSlot = ({ slotIndex, day, onAddEvent }) => {
	const [{ isOver }, dropRef] = useDrop({
		accept: DRAG_TYPE,
		drop: (item) => {
			return { day, slotIndex };
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	});

	const topPx = slotIndex * SLOT_HEIGHT;
	const background = isOver ? "rgba(0, 150, 255, 0.2)" : "transparent";

	const handleClick = (e) => {
		e.stopPropagation();
		const slotDate = new Date(day);
		slotDate.setHours(0, 0, 0, 0);
		slotDate.setTime(slotDate.getTime() + slotIndex * 15 * 60000);
		onAddEvent(slotDate);
	};

	return (
		<div
			ref={dropRef}
			className="absolute left-0 right-0 border-b border-gray-300 cursor-pointer"
			style={{
				top: topPx,
				height: SLOT_HEIGHT,
				backgroundColor: background,
			}}
			onClick={handleClick}
		/>
	);
};

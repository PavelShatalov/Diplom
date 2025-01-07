import React from "react";
import { useDrag } from "react-dnd";
import { DRAG_TYPE } from "./helpers";

export const EventBlock = ({ block, openEditModal, onUpdateEvent }) => {
	const [{ isDragging }, dragRef] = useDrag({
		type: DRAG_TYPE,
		item: {
			id: block.id,
			originalStart: block.startMs,
		},
		end: (item, monitor) => {
			const dropResult = monitor.getDropResult();
			if (item && dropResult) {
				const { day, slotIndex } = dropResult;
				const dayCopy = new Date(day);
				dayCopy.setHours(0, 0, 0, 0);
				const newStartMs = dayCopy.getTime() + slotIndex * 15 * 60000;
				onUpdateEvent(item.id, newStartMs);
			}
		},
		collect: (monitor) => ({
			isDragging: !!monitor.isDragging(),
		}),
	});

	const opacity = isDragging ? 0.5 : 1;

	const startTimeStr = new Date(block.startDate).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const endTimeStr = new Date(block.endDate).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	return (
		<div
			ref={dragRef}
			className="absolute bg-blue-500 text-white text-xs rounded px-1 py-1 cursor-pointer shadow-md"
			style={{
				top: block.topPx,
				left: "5%",
				width: "90%",
				height: block.heightPx,
				opacity,
			}}
			onClick={(e) => {
				e.stopPropagation();
				openEditModal(block);
			}}>
			<div className="font-semibold truncate">{block.title}</div>
			<div className="text-[0.6rem]">
				{startTimeStr} - {endTimeStr}
			</div>
		</div>
	);
};

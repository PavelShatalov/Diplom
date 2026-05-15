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
	const gapPx = 4;
	const columns = block.overlapColumns || 1;
	const column = block.overlapColumn || 0;
	const width = `calc(${100 / columns}% - ${gapPx + gapPx / columns}px)`;
	const left = `calc(${(100 / columns) * column}% + ${gapPx}px)`;

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
			className="absolute text-white text-xs rounded-md px-2 py-1 cursor-pointer shadow-sm ring-1 ring-white/30 overflow-hidden"
			style={{
				top: block.topPx,
				left,
				width,
				height: Math.max(block.heightPx - 2, 18),
				opacity,
				backgroundColor: block.color || "#2563eb",
			}}
			onClick={(e) => {
				e.stopPropagation();
				openEditModal(block);
			}}>
			<div className="font-semibold truncate leading-tight">{block.title}</div>
			<div className="flex items-center justify-between gap-1 text-[0.62rem] leading-tight text-white/90">
				<span>
					{startTimeStr} - {endTimeStr}
				</span>
				<span className="truncate opacity-90">{block.syncStatus || "local"}</span>
			</div>
		</div>
	);
};

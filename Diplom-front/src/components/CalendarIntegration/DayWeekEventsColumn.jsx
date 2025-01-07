import React from "react";
import axios from "axios";
import { EventBlock } from "./EventBlock";
import { getEventPartForDay, SLOT_HEIGHT, TOTAL_SLOTS } from "./helpers";

export const DayWeekEventsColumn = ({
	day,
	events,
	openEditModal,
	fetchEvents,
}) => {
	const dayStart = new Date(day);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(day);
	dayEnd.setHours(23, 59, 59, 999);

	const dayEventBlocks = events
		.map((ev) => getEventPartForDay(ev, dayStart, dayEnd))
		.filter(Boolean)
		.map((partialEv) => {
			const evStart = new Date(partialEv.startDate);
			const evEnd = new Date(partialEv.endDate);

			const startSlot = Math.floor(
				(evStart.getHours() * 60 + evStart.getMinutes()) / 15
			);
			const endSlot = Math.ceil(
				(evEnd.getHours() * 60 + evEnd.getMinutes()) / 15
			);
			const safeStart = Math.max(0, startSlot);
			const safeEnd = Math.min(TOTAL_SLOTS, endSlot);

			return {
				...partialEv,
				topPx: safeStart * SLOT_HEIGHT,
				heightPx: (safeEnd - safeStart) * SLOT_HEIGHT,
				startMs: evStart.getTime(),
				endMs: evEnd.getTime(),
			};
		})
		.sort((a, b) => a.startMs - b.startMs);

	return (
		<>
			{dayEventBlocks.map((block) => (
				<EventBlock
					key={block.id}
					block={block}
					openEditModal={openEditModal}
					onUpdateEvent={async (evId, newStartMs) => {
						const duration = block.duration || 15;
						const newEndMs = newStartMs + duration * 60000;

						try {
							await axios.put(`http://localhost:5000/api/events/${evId}`, {
								title: block.title,
								startDate: new Date(newStartMs).toISOString(),
								endDate: new Date(newEndMs).toISOString(),
							});
							fetchEvents();
						} catch (err) {
							console.error(err);
						}
					}}
				/>
			))}
		</>
	);
};

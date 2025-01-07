// import React from "react";
import React, { useContext } from "react";
// import axios from "axios";
import { AuthContext } from "../../AuthContext";
import { EventBlock } from "./EventBlock";
import { getEventPartForDay, SLOT_HEIGHT, TOTAL_SLOTS } from "./helpers";

export const DayWeekEventsColumn = ({
	day,
	events,
	openEditModal,
	fetchEvents,
}) => {
	const { authAxios } = useContext(AuthContext);
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
					key={block.id} // Уникальный key
					block={block}
					openEditModal={openEditModal}
					onUpdateEvent={async (evId, newStartMs) => {
						try {
							await authAxios.put(`/events/${evId}`, {
								title: block.title,
								startDate: new Date(newStartMs).toISOString(),
								endDate: new Date(
									newStartMs + (block.endMs - block.startMs)
								).toISOString(),
							});
							fetchEvents();
						} catch (err) {
							console.error("Error updating event:", err);
							alert("Ошибка при обновлении события.");
						}
					}}
				/>
			))}
		</>
	);
};

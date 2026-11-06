// src/data/store.js
// Shared in-memory data used by rooms.route.js and interviews.route.js.
// Replace this file with database models/repositories when a database is added.

export const rooms = [
  { id: 1, name: "A101", capacity: 4 },
  { id: 2, name: "A102", capacity: 6 },
  { id: 3, name: "B201", capacity: 4 },
  { id: 4, name: "B202", capacity: 8 }
];

export const interviews = [
  {
    id: 1,
    associationId: 2,
    roomId: 1,
    date: "2026-11-15",
    startTime: "10:00",
    endTime: "10:30",
    studentId: null,
    status: "available"
  }
];

export function hasRoomConflict({
  roomId,
  date,
  startTime,
  endTime,
  excludeInterviewId = null
}) {
  return interviews.some((interview) => {
    if (
      interview.roomId !== Number(roomId) ||
      interview.date !== date ||
      interview.id === excludeInterviewId ||
      interview.status === "cancelled"
    ) {
      return false;
    }

    // Time strings use the HH:mm format, so lexical comparison is valid.
    return startTime < interview.endTime && endTime > interview.startTime;
  });
}

export function isValidDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
}

export function isValidTime(time) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }
  return true;
}

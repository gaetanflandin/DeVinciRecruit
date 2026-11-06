// src/routes/rooms.route.js
import express from "express";
import { rooms, interviews, hasRoomConflict, isValidDate, isValidTime } from "../data/store.js";

const router = express.Router();

// GET /api/rooms - list all rooms
router.get("/", (req, res) => {
  res.status(200).json(rooms);
});

// GET /api/rooms/available?date=YYYY-MM-DD&startTime=HH:mm&endTime=HH:mm
// List rooms that are free for the requested time interval.
router.get("/available", (req, res) => {
  const { date, startTime, endTime } = req.query;

  if (
    !isValidDate(date) ||
    !isValidTime(startTime) ||
    !isValidTime(endTime) ||
    startTime >= endTime
  ) {
    return res.status(400).json({
      error: "Provide a valid date, startTime and endTime (HH:mm)."
    });
  }

  const availableRooms = rooms.filter((room) =>
    !hasRoomConflict({
      roomId: room.id,
      date,
      startTime,
      endTime
    })
  );

  return res.status(200).json(availableRooms);
});

// GET /api/rooms/:id - get one room
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const room = rooms.find((item) => item.id === id);

  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  return res.status(200).json(room);
});

// POST /api/rooms - add a room (administration use)
router.post("/", (req, res) => {
  const { name, capacity } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isInteger(Number(capacity)) ||
    Number(capacity) < 1
  ) {
    return res.status(400).json({
      error: "A room name and a positive integer capacity are required."
    });
  }

  const normalizedName = name.trim();
  if (rooms.some((room) => room.name.toLowerCase() === normalizedName.toLowerCase())) {
    return res.status(409).json({ error: "A room with this name already exists." });
  }

  const newRoom = {
    id: rooms.length ? Math.max(...rooms.map((room) => room.id)) + 1 : 1,
    name: normalizedName,
    capacity: Number(capacity)
  };

  rooms.push(newRoom);
  return res.status(201).json(newRoom);
});

// PUT /api/rooms/:id - update a room (administration use)
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = rooms.findIndex((room) => room.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Room not found." });
  }

  const { name, capacity } = req.body;
  if (name !== undefined && typeof name !== "string") {
    return res.status(400).json({ error: "Invalid room name or capacity." });
  }
  const updatedName = name === undefined ? rooms[index].name : name.trim();

  if (
    typeof updatedName !== "string" ||
    !updatedName ||
    (capacity !== undefined &&
      (!Number.isInteger(Number(capacity)) || Number(capacity) < 1))
  ) {
    return res.status(400).json({ error: "Invalid room name or capacity." });
  }

  const duplicate = rooms.some((room) =>
    room.id !== id && room.name.toLowerCase() === updatedName.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({ error: "A room with this name already exists." });
  }

  rooms[index] = {
    ...rooms[index],
    name: updatedName,
    ...(capacity !== undefined ? { capacity: Number(capacity) } : {})
  };

  return res.status(200).json(rooms[index]);
});

// DELETE /api/rooms/:id - delete a room if no interview uses it
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = rooms.findIndex((room) => room.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Room not found." });
  }

  const roomIsUsed = interviews.some(
    (interview) =>
      interview.roomId === id && interview.status !== "cancelled"
  );

  if (roomIsUsed) {
    return res.status(409).json({
      error: "This room is assigned to an interview. Cancel or move the interview first."
    });
  }

  rooms.splice(index, 1);
  return res.status(204).end();
});

export default router;

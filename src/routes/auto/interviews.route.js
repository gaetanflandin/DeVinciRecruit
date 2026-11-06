// src/routes/interviews.route.js
import express from "express";
import {
  rooms,
  interviews,
  hasRoomConflict,
  isValidDate,
  isValidTime
} from "../data/store.js";

const router = express.Router();

const VALID_STATUSES = ["available", "booked", "completed", "cancelled"];

function validateInterviewFields({ associationId, roomId, date, startTime, endTime }) {
  if (
    associationId === undefined ||
    associationId === null ||
    associationId === "" ||
    !Number.isInteger(Number(roomId)) ||
    !isValidDate(date) ||
    !isValidTime(startTime) ||
    !isValidTime(endTime) ||
    startTime >= endTime
  ) {
    return "Provide associationId, a valid roomId, date, startTime and endTime.";
  }

  if (!rooms.some((room) => room.id === Number(roomId))) {
    return "Room not found.";
  }

  return null;
}

// GET /api/interviews - list all interviews
router.get("/", (req, res) => {
  return res.status(200).json(interviews);
});

// GET /api/interviews/available?date=YYYY-MM-DD
// Date is optional; when supplied, only that date is returned.
router.get("/available", (req, res) => {
  const { date } = req.query;

  if (date !== undefined && !isValidDate(date)) {
    return res.status(400).json({ error: "Provide a valid date (YYYY-MM-DD)." });
  }

  const available = interviews.filter((interview) =>
    interview.status === "available" &&
    (date === undefined || interview.date === date)
  );

  return res.status(200).json(available);
});

// GET /api/interviews/:id - retrieve one interview
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const interview = interviews.find((item) => item.id === id);

  if (!interview) {
    return res.status(404).json({ error: "Interview not found." });
  }

  return res.status(200).json(interview);
});

// POST /api/interviews - association creates an interview slot
router.post("/", (req, res) => {
  const validationError = validateInterviewFields(req.body);

  if (validationError) {
    const status = validationError === "Room not found." ? 404 : 400;
    return res.status(status).json({ error: validationError });
  }

  const { associationId, roomId, date, startTime, endTime } = req.body;

  if (hasRoomConflict({ roomId, date, startTime, endTime })) {
    return res.status(409).json({
      error: "This room is already occupied during this time interval."
    });
  }

  const newInterview = {
    id: interviews.length
      ? Math.max(...interviews.map((interview) => interview.id)) + 1
      : 1,
    associationId: Number(associationId),
    roomId: Number(roomId),
    date,
    startTime,
    endTime,
    studentId: null,
    status: "available"
  };

  interviews.push(newInterview);
  return res.status(201).json(newInterview);
});

// POST /api/interviews/:id/book - student books an available slot
router.post("/:id/book", (req, res) => {
  const id = Number(req.params.id);
  const { studentId } = req.body;
  const interview = interviews.find((item) => item.id === id);

  if (!interview) {
    return res.status(404).json({ error: "Interview not found." });
  }

  if (studentId === undefined || studentId === null || studentId === "") {
    return res.status(400).json({ error: "studentId is required." });
  }

  if (interview.status !== "available") {
    return res.status(409).json({ error: "This interview slot is not available." });
  }

  interview.studentId = studentId;
  interview.status = "booked";

  return res.status(200).json(interview);
});

// PUT /api/interviews/:id - update a slot
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = interviews.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Interview not found." });
  }

  const current = interviews[index];
  const updated = { ...current, ...req.body, id };

  const validationError = validateInterviewFields(updated);
  if (validationError) {
    const status = validationError === "Room not found." ? 404 : 400;
    return res.status(status).json({ error: validationError });
  }

  if (!VALID_STATUSES.includes(updated.status)) {
    return res.status(400).json({ error: "Invalid interview status." });
  }

  // A booked interview must retain its student unless explicitly changed.
  if (updated.status === "available") {
    updated.studentId = null;
  }

  if (
    updated.status !== "cancelled" &&
    hasRoomConflict({
      roomId: updated.roomId,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      excludeInterviewId: id
    })
  ) {
    return res.status(409).json({
      error: "This room is already occupied during this time interval."
    });
  }

  interviews[index] = {
    ...updated,
    associationId: Number(updated.associationId),
    roomId: Number(updated.roomId)
  };

  return res.status(200).json(interviews[index]);
});

// DELETE /api/interviews/:id - delete a slot
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = interviews.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Interview not found." });
  }

  interviews.splice(index, 1);
  return res.status(204).end();
});

export default router;

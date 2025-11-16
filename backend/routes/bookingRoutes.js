const express = require("express");
const router = express.Router();
const db = require("../utils/dbConnection");
const { authenticateToken } = require('../middleware/authMiddleware');

router.get("/users/:userID", authenticateToken, async (req, res) => {
  const userID = req.params.userID;

  try {
    const [result] = await db.query(
      `SELECT b.*, p.propertyName, p.pAddress, p.pricePerNight
       FROM Bookings b
       JOIN Properties p ON b.propertyID = p.propertyID
       WHERE b.renterID = ?
       ORDER BY b.createdAt DESC`,
      [userID]
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/owner/:userID", authenticateToken, async (req, res) => {
  const userID = req.params.userID;

  try {
    const [result] = await db.query(
      `SELECT b.*, p.propertyName, p.pAddress, u.username, u.email 
       FROM Bookings b
       JOIN Properties p ON b.propertyID = p.propertyID
       JOIN Users u ON b.renterID = u.userID
       WHERE p.ownerID = ?
       ORDER BY b.createdAt DESC`,
      [userID]
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching owner bookings:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const { propertyID, renterID, startDate, endDate } = req.body;

  try {
    const [priceResult] = await db.query("SELECT pricePerNight FROM Properties WHERE propertyID = ?", [propertyID]);
    
    if (priceResult.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    const pricePerNight = priceResult[0].pricePerNight;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfNights = (end - start) / (1000 * 60 * 60 * 24);
    
    if (numberOfNights <= 0) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const totalPrice = pricePerNight * numberOfNights;

    const [result] = await db.query(
      "INSERT INTO Bookings (propertyID, renterID, startDate, endDate, totalPrice, bookingStatus) VALUES (?, ?, ?, ?, ?, 'Pending')",
      [propertyID, renterID, startDate, endDate, totalPrice]
    );

    const [newBooking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [result.insertId]);

    res.json({
      message: "Booking created successfully",
      booking: newBooking[0],
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:bookingID/approve", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;

  try {
    const [result] = await db.query("UPDATE Bookings SET bookingStatus = 'Approved' WHERE bookingID = ?", [bookingID]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const [updatedBooking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [bookingID]);

    res.json({
      message: "Booking approved successfully",
      booking: updatedBooking[0],
    });
  } catch (err) {
    console.error("Error approving booking:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/:bookingID/deny", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;

  try {
    const [result] = await db.query("UPDATE Bookings SET bookingStatus = 'Denied' WHERE bookingID = ?", [bookingID]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const [updatedBooking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [bookingID]);

    res.json({
      message: "Booking denied successfully",
      booking: updatedBooking[0],
    });
  } catch (err) {
    console.error("Error denying booking:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Demo purposes: Allow reviews on approved bookings without date validation
// Production: Should verify endDate < current date to ensure stay is completed
router.post("/:bookingID/review", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const [booking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [bookingID]);
    
    if (booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking[0].bookingStatus !== 'Approved') {
      return res.status(400).json({ error: "Can only review approved bookings" });
    }

    const [existingReview] = await db.query(
      "SELECT * FROM Reviews WHERE propertyID = ? AND renterID = ?",
      [booking[0].propertyID, booking[0].renterID]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ error: "You have already reviewed this property" });
    }

    const [result] = await db.query(
      "INSERT INTO Reviews (propertyID, renterID, rating, comment) VALUES (?, ?, ?, ?)",
      [booking[0].propertyID, booking[0].renterID, rating, comment || '']
    );

    const [newReview] = await db.query("SELECT * FROM Reviews WHERE reviewID = ?", [result.insertId]);

    res.json({
      message: "Review submitted successfully",
      review: newReview[0],
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update booking (only renter can update their own pending bookings)
router.put("/:bookingID", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    const [booking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [bookingID]);
    
    if (booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Authorization check: Only renter can update their booking
    if (booking[0].renterID !== userId) {
      return res.status(403).json({ error: "You are not authorized to edit this booking" });
    }

    // Can only update pending bookings
    if (booking[0].bookingStatus !== 'Pending') {
      return res.status(400).json({ error: "Can only edit pending bookings" });
    }

    // Recalculate total price
    const [priceResult] = await db.query("SELECT pricePerNight FROM Properties WHERE propertyID = ?", [booking[0].propertyID]);
    const pricePerNight = priceResult[0].pricePerNight;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfNights = (end - start) / (1000 * 60 * 60 * 24);
    
    if (numberOfNights <= 0) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const totalPrice = pricePerNight * numberOfNights;

    const [result] = await db.query(
      "UPDATE Bookings SET startDate = ?, endDate = ?, totalPrice = ? WHERE bookingID = ?",
      [startDate, endDate, totalPrice, bookingID]
    );

    const [updatedBooking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [bookingID]);

    res.json({
      message: "Booking updated successfully",
      booking: updatedBooking[0],
    });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Cancel/Delete booking (only renter can cancel their own pending bookings)
router.delete("/:bookingID", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;
  const userId = req.user.id;

  try {
    const [booking] = await db.query("SELECT * FROM Bookings WHERE bookingID = ?", [bookingID]);
    
    if (booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Authorization check: Only renter can cancel their booking
    if (booking[0].renterID !== userId) {
      return res.status(403).json({ error: "You are not authorized to cancel this booking" });
    }

    // Can only cancel pending bookings
    if (booking[0].bookingStatus !== 'Pending') {
      return res.status(400).json({ error: "Can only cancel pending bookings" });
    }

    const [result] = await db.query("DELETE FROM Bookings WHERE bookingID = ?", [bookingID]);

    res.json({
      message: "Booking cancelled successfully",
    });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
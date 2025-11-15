const express = require("express");
const router = express.Router();
const db = require("../utils/dbConnection");
const { authenticateToken } = require('../middleware/authMiddleware');


// gets all of a users bookings (protected)
router.get("/users/:userID", authenticateToken, async (req, res) => {
  const userID = req.params.userID;

  try {
    const [result] = await db.query(
      "SELECT * FROM Bookings WHERE renterID = ?", [userID]
    );
    res.json(result);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({error: "Database error"});
  }
});

// create a new booking (protected)
router.post("/", authenticateToken, async (req, res) => {
  const {propertyID, renterID, startDate, endDate} = req.body;

  try {
    // get price per night
    const [priceResult] = await db.query(
      `SELECT pricePerNight FROM Properties WHERE propertyID = ?`, [propertyID]
    );
    if (priceResult.length === 0) {
      return res.status(404).json({error: "Property not found"});
    }
    const pricePerNight = priceResult[0].pricePerNight;

    // get number of nights
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end - start;
    const numberOfNights = timeDiff / (1000 * 60 * 60 * 24);
    if (numberOfNights <= 0) {
      return res.status(400).json({error: "Invalid date range"});
    }

    // calculate total price
    const totalPrice = pricePerNight * numberOfNights;

    // insert booking
    const [result] = await db.query(
      `INSERT INTO Bookings (propertyID, renterID, startDate, endDate, totalPrice, bookingStatus)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [propertyID, renterID, startDate, endDate, totalPrice]
    );

    // Get the inserted booking
    const [newBooking] = await db.query(
      `SELECT * FROM Bookings WHERE bookingID = ?`,
      [result.insertId]
    );

    res.json({
      message: "Booking created successfully",
      booking: newBooking[0],
    });

  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({error: "Database error"});
  }
});

// approve a booking (protected)
router.put("/:bookingID/approve", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;

  try {
    const [result] = await db.query(
      `UPDATE Bookings SET bookingStatus = 'Approved' WHERE bookingID = ?`,
      [bookingID]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({error: "Booking not found"});
    }

    // Get the updated booking
    const [updatedBooking] = await db.query(
      `SELECT * FROM Bookings WHERE bookingID = ?`,
      [bookingID]
    );

    res.json({
      message: "Booking approved successfully",
      booking: updatedBooking[0],
    });
  } catch (err) {
    console.error("Error approving booking:", err);
    res.status(500).json({error: "Database error"});
  }
});

// deny a booking (protected)
router.put("/:bookingID/deny", authenticateToken, async (req, res) => {
  const bookingID = req.params.bookingID;

  try {
    const [result] = await db.query(
      `UPDATE Bookings SET bookingStatus = 'Denied' WHERE bookingID = ?`,
      [bookingID]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({error: "Booking not found"});
    }

    // Get the updated booking
    const [updatedBooking] = await db.query(
      `SELECT * FROM Bookings WHERE bookingID = ?`,
      [bookingID]
    );

    res.json({
      message: "Booking denied successfully",
      booking: updatedBooking[0],
    });
  } catch (err) {
    console.error("Error denying booking:", err);
    res.status(500).json({error: "Database error"});
  }
});

module.exports = router;
-- Drop existing tables if they exist
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Properties;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    fName VARCHAR(50) NOT NULL,
    lName VARCHAR(50) NOT NULL,
    pass VARCHAR(100) NOT NULL
);

CREATE TABLE Properties (
    propertyID INT AUTO_INCREMENT PRIMARY KEY,
    ownerID INT,
    propertyName VARCHAR(50) NOT NULL,
    pDescription TEXT NOT NULL,
    pAddress VARCHAR(300),
    pricePerNight DECIMAL(6,2) NOT NULL,
    rooms INT NOT NULL,
    imagePath VARCHAR(255),
    FOREIGN KEY (ownerID) REFERENCES Users(userID) ON DELETE SET NULL
);

CREATE TABLE Bookings (
    bookingID INT AUTO_INCREMENT PRIMARY KEY,
    propertyID INT,
    renterID INT,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    totalPrice DECIMAL(7,2) NOT NULL,
    bookingStatus ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    FOREIGN KEY (propertyID) REFERENCES Properties(propertyID) ON DELETE CASCADE,
    FOREIGN KEY (renterID) REFERENCES Users(userID) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    reviewID INT AUTO_INCREMENT PRIMARY KEY,
    propertyID INT,
    renterID INT,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    reviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propertyID) REFERENCES Properties(propertyID) ON DELETE CASCADE,
    FOREIGN KEY (renterID) REFERENCES Users(userID) ON DELETE CASCADE
);

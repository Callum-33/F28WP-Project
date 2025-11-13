CREATE DATABASE Rentals;
USE Rentals;

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
    pType VARCHAR(50) NOT NULL,
    pAddress VARCHAR(300),
    pricePerNight DECIMAL(6,2) NOT NULL,
    rooms INT NOT NULL,
    FOREIGN KEY (ownerID) REFERENCES Users(userID)
);

CREATE TABLE Bookings (
    bookingID INT AUTO_INCREMENT PRIMARY KEY,
    propertyID INT,
    renterID INT,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    totalPrice DECIMAL(7,2) NOT NULL,
    bookingStatus ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    FOREIGN KEY (propertyID) REFERENCES Properties(propertyID),
    FOREIGN KEY (renterID) REFERENCES Users(userID)
);

CREATE TABLE Reviews (
    reviewID INT AUTO_INCREMENT PRIMARY KEY,
    propertyID INT,
    renterID INT,
    rating TINYINT NOT NULL,
    comment TEXT,
    FOREIGN KEY (propertyID) REFERENCES Properties(propertyID),
    FOREIGN KEY (renterID) REFERENCES Users(userID)
);

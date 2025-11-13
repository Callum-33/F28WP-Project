CREATE DATABASE Rentals;
USE Rentals;

CREATE TABLE Users (
    userID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    passwordHash VARCHAR(255),
    salt VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    email VARCHAR(100),
    fName VARCHAR(50),
    lName VARCHAR(50),
    pass VARCHAR(100), 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Properties (
    propertyID INT AUTO_INCREMENT PRIMARY KEY,
    ownerID INT,
    propertyName VARCHAR(50) NOT NULL,
    pDescription TEXT NOT NULL,
    pAddress VARCHAR(300),
    pricePerNight DECIMAL(6,2) NOT NULL,
    rooms INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerID) REFERENCES Users(userID) ON DELETE CASCADE
);

CREATE TABLE Bookings (
    bookingID INT AUTO_INCREMENT PRIMARY KEY,
    propertyID INT,
    renterID INT,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    totalPrice DECIMAL(7,2) NOT NULL,
    bookingStatus ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propertyID) REFERENCES Properties(propertyID) ON DELETE CASCADE,
    FOREIGN KEY (renterID) REFERENCES Users(userID) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    reviewID INT AUTO_INCREMENT PRIMARY KEY,
    propertyID INT,
    renterID INT,
    rating TINYINT NOT NULL,
    comment TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (propertyID) REFERENCES Properties(propertyID) ON DELETE CASCADE,
    FOREIGN KEY (renterID) REFERENCES Users(userID) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_properties_owner ON Properties(ownerID);
CREATE INDEX idx_bookings_property ON Bookings(propertyID);
CREATE INDEX idx_bookings_renter ON Bookings(renterID);
CREATE INDEX idx_reviews_property ON Reviews(propertyID);
CREATE INDEX idx_reviews_renter ON Reviews(renterID);

-- Mock data insertion script for testing
USE rentals;

-- Clear existing mock data (be careful in production!)
DELETE FROM Bookings;
DELETE FROM Reviews;
DELETE FROM PropertyImages;
DELETE FROM Properties;
DELETE FROM Sessions;
DELETE FROM Users;

-- Reset auto-increment counters
ALTER TABLE Users AUTO_INCREMENT = 1;
ALTER TABLE Properties AUTO_INCREMENT = 1;
ALTER TABLE PropertyImages AUTO_INCREMENT = 1;
ALTER TABLE Reviews AUTO_INCREMENT = 1;
ALTER TABLE Bookings AUTO_INCREMENT = 1;
ALTER TABLE Sessions AUTO_INCREMENT = 1;

-- Create mock users (owners of the properties)
INSERT INTO Users (userID, username, passwordHash, salt, role, email, fName, lName) VALUES
(1, 'john_owner', 'mock_hash_1', 'mock_salt_1', 'user', 'john@example.com', 'John', 'Smith'),
(2, 'sarah_host', 'mock_hash_2', 'mock_salt_2', 'user', 'sarah@example.com', 'Sarah', 'Johnson'),
(3, 'mike_landlord', 'mock_hash_3', 'mock_salt_3', 'user', 'mike@example.com', 'Mike', 'Williams'),
(4, 'emma_property', 'mock_hash_4', 'mock_salt_4', 'user', 'emma@example.com', 'Emma', 'Davis');

-- Create mock properties
INSERT INTO Properties (propertyID, ownerID, propertyName, pDescription, pAddress, pricePerNight, rooms) VALUES
(1, 1, 'Modern Downtown Apartment', 'Stunning modern apartment in the heart of downtown with amazing city views.', '123 Main St, New York, NY', 150.00, 2),
(2, 1, 'Cozy Beach House', 'Beautiful beach house with direct ocean access and stunning sunset views.', '456 Ocean Ave, Miami, FL', 220.00, 3),
(3, 2, 'Mountain Cabin Retreat', 'Rustic cabin nestled in the mountains, perfect for a peaceful getaway.', '789 Pine Rd, Aspen, CO', 180.00, 2),
(4, 2, 'Urban Loft Studio', 'Stylish loft in the arts district with exposed brick and high ceilings.', '321 Art District, Los Angeles, CA', 135.00, 1),
(5, 3, 'Lakeside Villa', 'Luxurious villa with private dock and panoramic lake views.', '555 Lake View Dr, Austin, TX', 195.00, 4),
(6, 3, 'Historic Brownstone', 'Charming brownstone in historic neighborhood with original details.', '777 Heritage St, Boston, MA', 165.00, 3),
(7, 4, 'Desert Oasis', 'Modern desert home with infinity pool and mountain backdrop.', '999 Canyon Blvd, Phoenix, AZ', 140.00, 2),
(8, 4, 'Waterfront Condo', 'Sleek waterfront condo with floor-to-ceiling windows and marina views.', '888 Harbor Way, Seattle, WA', 210.00, 2);

-- Create mock property images (using the image URLs from the JSON)
INSERT INTO PropertyImages (propertyID, imagePath, isPrimary, displayOrder) VALUES
(1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=400&fit=crop', TRUE, 0),
(2, 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=400&fit=crop', TRUE, 0),
(3, 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=400&fit=crop', TRUE, 0),
(4, 'https://images.unsplash.com/photo-1502672260066-6bc35f0a8746?w=400&h=400&fit=crop', TRUE, 0),
(5, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=400&fit=crop', TRUE, 0),
(6, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=400&fit=crop', TRUE, 0),
(7, 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=400&h=400&fit=crop', TRUE, 0),
(8, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=400&fit=crop', TRUE, 0);

-- Create some mock reviews to match the ratings from the JSON
INSERT INTO Reviews (propertyID, renterID, rating, comment) VALUES
(1, 2, 5, 'Amazing apartment with great views!'),
(1, 3, 5, 'Perfect location and very clean.'),
(1, 4, 5, 'Highly recommend this place!'),
(2, 2, 5, 'Best beach house ever!'),
(2, 3, 5, 'Absolutely stunning sunset views.'),
(3, 1, 5, 'Very peaceful and relaxing.'),
(3, 3, 5, 'Perfect mountain getaway!'),
(3, 4, 4, 'Great place, could use better WiFi.'),
(4, 1, 5, 'Love the exposed brick!'),
(4, 3, 5, 'Great location in arts district.'),
(4, 2, 4, 'Nice loft, a bit small for two people.'),
(5, 1, 5, 'Luxurious villa, exceeded expectations!'),
(5, 2, 5, 'Private dock was amazing!'),
(5, 4, 5, 'Best property we have ever stayed at.'),
(6, 1, 5, 'Love the historic charm.'),
(6, 2, 4, 'Beautiful brownstone, some minor issues.'),
(6, 4, 5, 'Great neighborhood!'),
(7, 1, 5, 'Perfect desert retreat!'),
(7, 2, 5, 'The infinity pool is incredible.'),
(7, 3, 4, 'Great place, very hot in summer though.'),
(8, 1, 5, 'Stunning marina views!'),
(8, 2, 5, 'Floor-to-ceiling windows are amazing.'),
(8, 3, 5, 'Perfect waterfront location.');

-- Create some mock bookings
INSERT INTO Bookings (propertyID, renterID, startDate, endDate, totalPrice, bookingStatus) VALUES
(1, 2, '2025-12-01', '2025-12-05', 600.00, 'Approved'),
(2, 3, '2025-12-10', '2025-12-17', 1540.00, 'Approved'),
(3, 4, '2025-11-20', '2025-11-23', 540.00, 'Pending'),
(5, 1, '2025-12-15', '2025-12-20', 975.00, 'Approved'),
(7, 2, '2025-11-25', '2025-11-28', 420.00, 'Pending');

SELECT 'Mock data inserted successfully!' as message;
SELECT COUNT(*) as user_count FROM Users;
SELECT COUNT(*) as property_count FROM Properties;
SELECT COUNT(*) as image_count FROM PropertyImages;
SELECT COUNT(*) as review_count FROM Reviews;
SELECT COUNT(*) as booking_count FROM Bookings;

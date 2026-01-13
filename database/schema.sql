-- Create Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    credits INT DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Submissions Table
CREATE TABLE submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plastic_type VARCHAR(20) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL,
    credits INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submission_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Redemptions Table
CREATE TABLE redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    credits_spent INT NOT NULL,
    redemption_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert Demo Users (passwords are plain text for demo - use bcrypt in production)
INSERT INTO users (username, password, credits, is_admin) VALUES 
('demo_user', 'demo123', 150, FALSE),
('admin', 'admin123', 0, TRUE);

-- Insert Demo Submissions
INSERT INTO submissions (user_id, plastic_type, weight, credits, status, submission_date) VALUES 
(1, 'PET', 5.0, 50, 'approved', '2025-10-10'),
(1, 'HDPE', 3.0, 30, 'approved', '2025-10-12');
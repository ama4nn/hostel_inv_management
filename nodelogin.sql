

CREATE TABLE Room (
    room_no VARCHAR(4) PRIMARY KEY,
    capacity INT NOT NULL,
    block_id CHAR NOT NULL
);

-- Table for Resource
CREATE TABLE Resource (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    resource_name VARCHAR(100) NOT NULL,
    quantity INT,
    price INT,
    p_date DATE
);

-- Table for Resource Requests
CREATE TABLE ResourceRequests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    room_no VARCHAR(4),
    resource_id INT,
    student_id VARCHAR(8) NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    request_date DATE,
    INDEX idx_student_id (student_id)  -- Adding an index on student_id
) ENGINE=InnoDB;

-- Table for Maintenance Log
CREATE TABLE MaintenanceLog (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    date_completed DATE,
    request_id INT,
    student_id VARCHAR(8),
    FOREIGN KEY (request_id) REFERENCES ResourceRequests(request_id),
    FOREIGN KEY (student_id) REFERENCES ResourceRequests(student_id)
) ENGINE=InnoDB;

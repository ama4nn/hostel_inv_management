var mysql = require("mysql");

//module.exports =router;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodelogin",
  port: 3306
});

con.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("you are connected");
  }
});

module.exports.signup = (username, email, password, status, callback) => {
  var query =
    "INSERT INTO `users`(`username`,`email`,`password`,`email_status`) VALUES ('" +
    username + "','" +
    email + "','" +
    password + "','" +
    status + "')";
  con.query(query, callback);
};

module.exports.getuserid = (email, callback) => {
  var query = "SELECT * from verify where email = '" + email + "' ";
  con.query(query, callback);
};

module.exports.verify = (username, email, token, callback) => {
  var query =
    "insert into `verify` (`username`,`email`,`token`) values ('" +
    username + "','" +
    email + "','" +
    token + "')";
  con.query(query, callback);
};

module.exports.addRequest = (room_no, resource_id, student_id, request_date, quantity, 
  callback = (error, results) => {
    if (error) {
      console.error("Database error:", error);
    } else {
      console.log("Query successful:", results);
    }
  }) => {
  var status = "Pending";
  console.log("room_no:", room_no);
  console.log("resource_id:", resource_id);
  console.log("student_id:", student_id);
  console.log("request_date:", request_date);
  console.log("quantity:", quantity);
  console.log("status:", status);
  if (
    room_no == "" ||
    resource_id == null ||
    student_id == "" ||
    student_id.length != 8 ||
    request_date == "0000-00-00" ||
    quantity == 0 ||
    status == null
  ) {
    console.error("One or more parameters are undefined or null");
    return callback(new Error("Invalid parameters"));
  }

  const query = `
    INSERT INTO resourcerequests (room_no, resource_id, student_id, quantity, status, request_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  con.query(query, [room_no, resource_id, student_id, quantity, status, request_date], callback);

};


module.exports.getAllRequests = (callback) => {
  var query = "SELECT * FROM resourcerequests";
  con.query(query, callback);
};

module.exports.editResources = function (resourceId, requestId, callback) {
  const query = `
      UPDATE Resource r
      JOIN ResourceRequests rr ON r.resource_id = rr.resource_id
      SET r.quantity = r.quantity - rr.quantity
      WHERE r.resource_id = ? AND rr.request_id = ?
  `;

  console.log("Executing query:", query);
  con.query(query, [resourceId, requestId], function (err, result) {
      if (err) {
          console.error("Error updating resource quantity:", err);
          return callback(err);
      }
      console.log("Resource quantity updated successfully");
      callback(null, result);
  });
};


module.exports.getResourceIdAndQuantity = function (requestId, callback) {
  const query = "SELECT resource_id, quantity FROM ResourceRequests WHERE request_id = ?";
  con.query(query, [requestId], function (err, results) {
      if (err) return callback(err);
      callback(null, results[0]); // Return first result if found
  });
};

module.exports.getPendingRequests = function(callback) {
  var query = "SELECT * FROM resourcerequests WHERE status = 'Pending'";
  con.query(query, callback);
}

module.exports.getRequestById = function (id, callback) {
  var query = "SELECT * FROM resourcerequests WHERE request_id=" + id;
  console.log(query);
  con.query(query, callback);
};

module.exports.approveRequest = function (id, callback) {
  var query = "UPDATE resourcerequests SET status = 'Approved' WHERE request_id = " + id;
  con.query(query, callback);

};

module.exports.rejectRequest = function (id, callback) {
  var query = "UPDATE resourcerequests SET status = 'Rejected' WHERE request_id = " + id;
  con.query(query, callback);
};

module.exports.deleteRequest = function (id, callback) {
  var query = "DELETE FROM resourcerequests WHERE request_id=" + id;
  con.query(query, callback);
};

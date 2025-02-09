var mysql = require("mysql");

//module.exports = router;

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
    console.log("SQL connection established successfully!");
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

  const query1 = `
    INSERT INTO resourcerequests (room_no, resource_id, student_id, quantity, status, request_date)
    VALUES ('` + room_no + `', ` + resource_id + `, '`+student_id+`', `+quantity+`, '`+status+`', '`+request_date+`');
  `;


  con.query(query1, function (err, result) {
    if (err) {
      return callback(err);
    }
    const reqId = result.insertId;
    console.log("Inserted ID: ", reqId);

    const query2 =  `
      INSERT INTO maintenancelog (date_completed, request_id, student_id, action_type)
      VALUES ('`+request_date+`', `+reqId+`, '`+student_id+`', "Added Pending");
    `

    con.query(query2, callback);
  });
};


module.exports.getAllRequests = (callback) => {
  var query = "SELECT * FROM resourcerequests";
  con.query(query, callback);
};

module.exports.getAllLogs = (callback) => {
  var query = "SELECT * FROM maintenancelog";
  con.query(query, callback);
}

module.exports.editResources = function (resource_id, requestId, callback) {
  const query = `
      UPDATE Resource r
      JOIN ResourceRequests rr ON r.resource_id = rr.resource_id
      SET r.quantity = r.quantity - rr.quantity
      WHERE r.resource_id = ? AND rr.request_id = ?
  `;

  console.log("Executing query:", query);
  con.query(query, [resource_id, requestId], function (err, result) {
      if (err) {
          console.error("Error updating resource quantity:", err);
          return callback(err);
      }
      console.log("Resource quantity updated successfully");
      callback(null, result);
  });
};


module.exports.getResource_idAndQuantity = function (requestId, callback) {
  const query = "SELECT resource_id, quantity FROM ResourceRequests WHERE request_id = ?";
  con.query(query, [requestId], function (err, results) {
      if (err) return callback(err);
      callback(null, results[0]); // Return first result if found
  });
};

module.exports.getResourceQuantity = function (resource_id, callback) {
  const query = "SELECT quantity FROM Resource WHERE resource_id = ?";
  con.query(query, [resource_id], function (err, results) {
      if (err) return callback(err);
      callback(null, results[0]?.quantity); // Return the quantity if it exists
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


module.exports.validateAndApproveRequest = function (requestId, callback) {
  // Query to get resource_id, requested quantity, and current resource quantity
  const query = `
      SELECT rr.resource_id, rr.quantity AS request_quantity, r.quantity AS resource_quantity 
      FROM ResourceRequests rr
      JOIN Resource r ON rr.resource_id = r.resource_id
      WHERE rr.request_id = ?
  `;
  con.query(query, [requestId], function (err, results) {
      if (err) {
        console.error("Error approving request:", err.message);
        // Render the appointment page with an error message
        return res.render('appointment', {
            error: err.message,
            list: req.session.appointments || [], // Pass current appointment list to the template
        });
      }

      if (results.length === 0) return callback(new Error("Request not found"));

      const { resource_id, request_quantity, resource_quantity } = results[0];

      // Validate quantity
      if (resource_quantity < request_quantity) {
          return callback(new Error("Insufficient resource quantity"));
      }

      // Approve the request and update resource quantity
      const updateQuery = `
          UPDATE ResourceRequests rr
          JOIN Resource r ON rr.resource_id = r.resource_id
          SET rr.status = 'Approved', r.quantity = r.quantity - ?
          WHERE rr.request_id = ? AND rr.resource_id = ?
      `;
      con.query(updateQuery, [request_quantity, requestId, resource_id], function(err, result) {
        if (err) {
          return callback(err);
        }

        const getReqQuery = `SELECT request_date, student_id FROM resourcerequests WHERE request_id = ` + requestId;
        con.query(getReqQuery, function(err, result1) {
          if (err) {
            return callback(err);
          }
          const {request_date, student_id} = result1[0];
          console.log("Result of retrieving requests Query is " + student_id + " and " + request_date);

          const localDate = new Date(request_date);
          const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
          
          const logApprovalQuery = `
                  INSERT INTO maintenancelog (date_completed, request_id, student_id, action_type)
                  VALUES ('`+formattedDate+`', `+requestId+`, '`+student_id+`', "Accepted Request");
          `;
          con.query(logApprovalQuery, callback);
        })
      });
  });
};


module.exports.rejectRequest = function (id, callback) {
  var query = "UPDATE resourcerequests SET status = 'Rejected' WHERE request_id = " + id;
  con.query(query, function(err, result) {
    if (err) {
      return callback(err);
    }
    var selectQuery = `SELECT request_date, student_id FROM resourcerequests WHERE request_id = ` + id;
    con.query(selectQuery, function(err, result) {
      if (err) {
        return callback(err);
      }
      const {request_date, student_id} = result[0];
      console.log("Result of retrieving requests Query is " + student_id + " and " + request_date);

      const localDate = new Date(request_date);
      const formattedDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
      
      const logRejectionQuery = `
        INSERT INTO maintenancelog (date_completed, request_id, student_id, action_type)
        VALUES ('`+formattedDate+`', `+id+`, '`+student_id+`', "Rejected Request");
      `;
      con.query(logRejectionQuery, callback);
    })
  });
};

module.exports.deleteRequest = function (id, callback) {
  var query = "DELETE FROM resourcerequests WHERE request_id=" + id;
  con.query(query, callback);
};


// resource function

module.exports.getResources = function (callback) {
  var query = "select *from resource order by resource_id desc";
  console.log(query);
  con.query(query, callback);
};

module.exports.editmed = function (
  resource_id,
  quantity,
  callback
) {
  var query =
    "update resource set quantity='" +
    quantity +
    "' where resource_id=" +
    resource_id;
  console.log(query);
  con.query(query, callback);
};

module.exports.updateResources = function (
  resource_id,
  price,
  quantity,
  p_date,
  callback
) {
  var query =
    "update resource set price='" +
    price +
    "',quantity='" +
    quantity +
    "',p_date='" +
    p_date +
    "' where resource_id=" +
    resource_id;
  console.log(query);
  con.query(query, callback);
};

module.exports.getResource = function (resource_id, callback) {
  var query = "select * from resource where resource_id=" + resource_id;
  con.query(query, callback);
};

module.exports.addResources = function (
  resource_id,
  name, 
  p_date,
  price,
  quantity,
  callback
) {
  var query =
    "Insert into resource (resource_id, resource_name,p_date,price,quantity) values('" +
    resource_id +
     "','" +
    name +
    "','" +
    p_date +
    "','" +
    price +
    "','" +
    quantity +
    "')";
  console.log(query);
  con.query(query, callback);
};

module.exports.countEntries = function (callback) {
  var query = "SELECT COUNT(*) AS count FROM resource";
  
  con.query(query, function (err, results) {
    if (err) {
        return callback(err, null);
    }
    return callback(results[0].count, null);
})
};
module.exports.deleteResourceColumn = function(resource_id,callback) {
  console.log("i m here");
  var query = "DELETE FROM resource WHERE resource_id ="+resource_id;

  con.query(query,callback);
  console.log(query);
}
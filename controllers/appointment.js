var express = require ('express');
var router = express.Router();
var db = require.main.require ('./models/db_controller');
var bodyPaser = require ('body-parser');

router.get('*', function(req, res, next){
	if(req.cookies['username'] == null){
		res.redirect('/login');
	}else{
		next();
	}
});

router.get('/',function(req,res){
    db.getAllRequests(function(err,result){
        res.render('appointment.ejs',{list :result});
    })
    
});

router.get('/addRequest',function(req,res){
    res.render('addRequest.ejs');
});

router.post('/addRequest',function(req,res){
    db.addRequest(req.body.room_no,req.body.resource_id,req.body.student_id,req.body.request_date,req.body.quantity,function(err,result){
        res.redirect('/appointment');
    });

});


router.get('/edit_appointment/:id',function(req,res){
    var id = req.params.id;
    db.getRequestById(id,function(err,result){
        console.log(result);
        res.render('edit_appointment.ejs',{list : result});
    });

});

router.post('/edit_appointment/:id',function(req,res){
    var id = req.params.id;
    db.editappointment(id,req.body.p_name,req.body.department,req.body.d_name,req.body.date,req.body.time,req.body.email,req.body.phone,function(err,result){
        res.redirect('/appointment');
    });
});


router.get('/deleteRequest/:id',function(req,res){
    var id = req.params.id;
    db.getRequestById(id,function(err,result){
        console.log(result);
        res.render('deleteRequest.ejs',{list:result});
    })
    
});

router.get('/approveRequest/:id', function (req, res) {
    const requestId = req.params.id;

    db.validateAndApproveRequest(requestId, function (err, result) {
        if (err) {
            console.error("Error approving request:", err.message);

            // Fetch the appointments list to display on the UI
            db.getAllRequests(function (appointmentsErr, appointments) {
                if (appointmentsErr) {
                    console.error("Error fetching appointments:", appointmentsErr);
                    return res.status(500).send("Error fetching appointments");
                }

                // Render the page with the error message
                res.render('appointment', {
                    error: err.message,
                    list: appointments, // Pass the list of appointments
                });
            });

            return; // Ensure the function doesn't proceed further
        }

        console.log("Request approved successfully");
        res.redirect('/appointment');
    });
});


router.get('/rejectRequest/:id', function(req, res) {
    var id = req.params.id;
    db.rejectRequest(id, function(err, result) {
        res.redirect('/appointment');
    });
});

router.post('/deleteRequest/:id',function(req,res){
    var id = req.params.id;
    db.deleteRequest(id,function(err,result){
        res.redirect('/appointment');
    });
})

module.exports = router;
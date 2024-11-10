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
    db.getallappointment(function(err,result){
        console.log(result);
        res.render('appointment.ejs',{list :result});
    })
    
});

router.get('/add_appointment',function(req,res){
    res.render('add_appointment.ejs');
});

router.post('/add_appointment',function(req,res){
    db.add_appointment(req.body.room_no,req.body.resource_id,req.body.student_id,req.body.request_date,req.body.quantity,function(err,result){
        res.redirect('/appointment');
    });

});


router.get('/edit_appointment/:id',function(req,res){
    var id = req.params.id;
    db.getappointmentbyid(id,function(err,result){
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


router.get('/delete_appointment/:id',function(req,res){
    var id = req.params.id;
    db.getappointmentbyid(id,function(err,result){
        console.log(result);
        res.render('delete_appointment.ejs',{list:result});
    })
    
});

router.get('/approve_request/:id', function(req, res) {
    const requestId = req.params.id;

    db.approveRequest(requestId, function(err, result) {
        if (err) {
            console.error("Error approving request:", err);
            return res.status(500).send("Error approving request");
        }
        console.log("Request approved with ID:", requestId);

        // Retrieve resource_id and quantity directly from ResourceRequests
        db.getResourceIdAndQuantity(requestId, function(err, data) {
            if (err || !data) {
                console.error("Error retrieving resource details:", err);
                return res.status(500).send("Error retrieving resource details");
            }

            const { resource_id, quantity } = data;

            // Update the Resource table with the new quantity
            db.editResources(resource_id, requestId, function(err, result) {
                if (err) {
                    console.error("Error updating resource quantity:", err);
                    return res.status(500).send("Error updating resource quantity");
                }
                console.log("Resource quantity updated:", result);
                res.redirect('/appointment');
            });
        });
    });
});

router.get('/reject_request/:id', function(req, res) {
    var id = req.params.id;
    db.rejectRequest(id, function(err, result) {
        res.redirect('/appointment');
    });
});

router.post('/delete_appointment/:id',function(req,res){
    var id =req.params.id;
    db.deleteappointment(id,function(err,result){
        res.redirect('/appointment');
    });
})









module.exports =router;
var express = require ('express');
var router = express.Router();
var db = require.main.require ('./models/db_controller');

router.get('/',function(req,res){

    


    db.getAllLogs(function(err,result){
        console.log(result);
        res.render('logs.ejs', {list : result});
    })
    
});



module.exports = router;
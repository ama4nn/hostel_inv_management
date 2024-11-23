var express = require ('express');
var router = express.Router();
var db = require.main.require ('./models/db_controller');

function isStudent(req, res, next) {
    if (req.user && req.user.role === 'student') {
        return next();
    }
    res.status(403).send('Access denied: Students only');
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

router.get('/',isAuthenticated, isStudent, function(req,res){

    db.getAllLogs(function(err,result){
        res.render('logs.ejs', {list : result, user: req.user});
    })
});


module.exports = router;
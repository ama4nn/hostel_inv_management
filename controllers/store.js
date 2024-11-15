var mysql = require('mysql');
var express = require('express');
var cookie = require('cookie-parser');
var db = require.main.require('./models/db_controller');

var router = express.Router();

// Middleware to check if the user is logged in
router.get('*', function(req, res, next){
    if (req.cookies['username'] == null) {
        res.redirect('/login');
    } else {
        next();
    }
});

// Route to display the list of resources
router.get('/', function(req, res) {
    db.getResources(function(err, result) {
        if (err) {
            console.error('Error fetching resources:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('store.ejs', { list: result });
    });
});

// Route to render the add medicine form
router.get('/add_med', function(req, res) {
    res.render('add_med', { errorMessage: null });
});

// Route to handle adding a new resource
router.post('/add_med', function(req, res) {
    var name = req.body.resource_name;
    
    var currentDate = new Date();
    var year = currentDate.getFullYear();
    var day = String(currentDate.getDate()).padStart(2, '0');
    var month = String(currentDate.getMonth() + 1).padStart(2, '0');
    var p_date = `${year}-${month}-${day}`;

    var price = req.body.price;
    var quantity = req.body.quantity;

    db.countEntries(function(count) {
        var newId = count + 1;

        db.addResources(newId, name, p_date, price, quantity, function(err, result) {
            if (err) {
                if (err.code) {
                    return res.render('add_med', { errorMessage: 'A resource with this ID already exists. Please use a unique resource ID.' });
                } else {
                    console.error('Database insertion error:', err);
                    return res.status(500).send('Internal Server Error');
                }
            }
            res.redirect('/store');
        });
    });
});

// Route to display the edit form for a specific resource
router.get('/edit_med/:resource_id', function(req, res) {
    var resource_id = req.params.resource_id;
    db.getResource(resource_id, function(err, result) {
        if (err) {
            console.error('Error fetching medicine details:', err);
            return res.status(500).send('Internal Server Error');
        }   
        res.render('edit_med.ejs', { list: result, resource_id });
    });
});

// Route to handle updating the resource
router.post('/edit_med/:resource_id', function(req, res) {
    var resource_id = req.params.resource_id;
    var price = req.body.price;
    var quantity = req.body.quantity;

    var currentDate = new Date();
    var year = currentDate.getFullYear();
    var day = String(currentDate.getDate()).padStart(2, '0');
    var month = String(currentDate.getMonth() + 1).padStart(2, '0');
    var p_date = `${year}-${month}-${day}`;

    console.log(resource_id);
    console.log(price);
    console.log(quantity);


    db.updateResources(resource_id, price,quantity, p_date, function(err) {
        if (err) {
            console.error('Error updating resource:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/store'); // Redirect after successful update
    });
});

// Route to handle deleting the resource
router.post('/edit_med/delete/:resource_id', function(req, res) {
    const resource_id = req.params.resource_id;

    db.deleteResourceColumn(resource_id, function(err) {
        if (err) {
            console.error('Error deleting resource:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.redirect('/store'); // Redirect after successful deletion
    });
});

// Route to handle searching for a resource
router.post('/search', function(req, res) {
    var key = req.body.search;
    db.searchmed(key, function(err, result) {
        if (err) {
            console.error('Error searching resources:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('store.ejs', { list: result });
    });
});

module.exports = router;
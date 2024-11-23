require('dotenv').config(); // Load environment variables
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const { con } = require('./models/db_controller'); // Import database connection

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'defaultSecretKey',
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// --- Google OAuth Configuration ---
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback1',
        },
        (accessToken, refreshToken, profile, done) => {
            const googleId = profile.id;
            const email = profile.emails[0].value;

            // Assign role based on email domain
            const role = email.endsWith('@iiitdmj.ac.in') ? 'student' : 'admin';

            // Check if user exists in the database
            con.query('SELECT * FROM user WHERE google_id = ?', [googleId], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return done(err);
                }

                if (results.length > 0) {
                    const user = results[0];

                    // Update role if necessary
                    if (user.role !== role) {
                        con.query('UPDATE user SET role = ? WHERE id = ?', [role, user.id], (updateErr) => {
                            if (updateErr) console.error('Error updating role:', updateErr);
                        });
                    }

                    return done(null, user);
                }

                // Insert new user if not found
                const newUser = {
                    google_id: googleId,
                    email,
                    username: profile.displayName,
                    role,
                };

                con.query('INSERT INTO user SET ?', newUser, (insertErr, result) => {
                    if (insertErr) {
                        console.error('Error inserting new user:', insertErr);
                        return done(insertErr);
                    }
                    newUser.id = result.insertId;
                    return done(null, newUser);
                });
            });
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
});

passport.deserializeUser((user, done) => {
    con.query('SELECT * FROM user WHERE id = ?', [user.id], (err, results) => {
        if (err) {
            console.error('Error during deserialization:', err);
            return done(err);
        }

        if (results.length === 0) {
            console.error('User not found during deserialization');
            return done(null, false);
        }

        done(null, results[0]);
    });
});

// --- Routes ---
app.get('/', (req, res) => {
    res.redirect('/auth/google'); // Default to Google login page
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
    '/auth/google/callback1',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Redirect based on role
        if (req.user.role === 'student') {
            res.redirect('/logs');
        } else {
            res.redirect('/home');
        }
    }
);

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// --- Protected Routes ---
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function isStudent(req, res, next) {
    if (req.user && req.user.role === 'student') {
        return next();
    }
    res.status(403).send('Access denied: Students only');
}

function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied: Admins only');
}

// Routes for student and admin
app.get('/home', isAuthenticated, isAdmin, (req, res) => {
    res.render('home', { user: req.user });
});

// app.get('/logs', isAuthenticated, isStudent, (req, res) => {
//     res.render('logs', { user: req.user });
// });

// Import other controllers
app.use('/appointment', require('./controllers/appointment'));
app.use('/login', require('./controllers/login'));
app.use('/logout', require('./controllers/logout'));
app.use('/logs', require('./controllers/logs'));
app.use('/store', require('./controllers/store'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

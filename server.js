require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const app = express();

// ===== SESSION =====
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Render vẫn OK
}));

// ===== PASSPORT =====
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ===== GOOGLE LOGIN =====
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// ===== LOGIN =====
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// ===== LƯU USER =====
global.users = {};

// ===== CALLBACK =====
app.get("/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/"
    }),
    (req, res) => {

        const token = crypto.randomBytes(16).toString("hex");

        global.users[token] = {
            name: req.user.displayName,
            email: req.user.emails[0].value
        };

        // 🔥 LƯU TOKEN VÀO SESSION
        req.session.token = token;

        res.send(`
            <h2>Login thành công ✅</h2>
            <p>Bạn có thể quay lại game</p>
        `);
    }
);

// ===== API LẤY TOKEN (AUTO) =====
app.get("/get-token", (req, res) => {
    if (!req.session.token) {
        return res.json({ success: false });
    }

    res.json({
        success: true,
        token: req.session.token
    });
});

// ===== API LẤY USER =====
app.get("/user", (req, res) => {
    const token = req.query.token;

    if (!token || !global.users[token]) {
        return res.json({ success: false });
    }

    res.json({
        success: true,
        user: global.users[token]
    });
});

// ===== TEST =====
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server chạy tại port " + PORT));
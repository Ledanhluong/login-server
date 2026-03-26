require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");

const app = express();

// ===== TRUST PROXY (CHO RENDER) =====
app.set("trust proxy", 1);

// ===== SESSION =====
app.use(session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: "none"
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// ===== PASSPORT =====
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// ===== LƯU USER (RAM - TẠM) =====
global.users = {};

// ===== ROUTE =====

// test
app.get("/", (req, res) => {
    res.send("Server chạy OK 🚀");
});

// login google
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback google
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {

        if (!req.user) {
            return res.redirect("/");
        }

        const token = crypto.randomBytes(16).toString("hex");

        const name = req.user.displayName || "NoName";
        const email = (req.user.emails && req.user.emails.length > 0)
            ? req.user.emails[0].value
            : "NoEmail";

        global.users[token] = { name, email };

        console.log("User login:", global.users[token]);

        // ===============================
        // 🔥 AUTO LOGIN VỀ GAME
        // ===============================
        return res.redirect(`mygame://login?token=${token}`);

        // ===============================
        // ⚠️ DÙNG TEST TRÊN WEB (tạm mở nếu cần)
        // ===============================
        // return res.redirect(`/success?token=${token}`);
    }
);

// ===== TRANG TEST (OPTIONAL) =====
app.get("/success", (req, res) => {
    const token = req.query.token || "Không có token";

    res.send(`
        <h2>Login thành công ✅</h2>
        <p>Token (test):</p>
        <h3>${token}</h3>
    `);
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

// ===== API CHECK TOKEN =====
app.get("/verify-token", (req, res) => {
    const token = req.query.token;

    if (!token || !global.users[token]) {
        return res.json({ valid: false });
    }

    res.json({ valid: true });
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server chạy port:", PORT);
});
require("dotenv").config();

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function loadUsers() {
    try {
        return JSON.parse(fs.readFileSync("users.json"));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

let otpStore = {};

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ===== SEND OTP =====
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[email] = otp;

    console.log("OTP:", otp);

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "OTP GAME",
            text: "Mã OTP của bạn là: " + otp
        });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
});

// ===== REGISTER =====
app.post("/register", (req, res) => {
    const { email, password, otp } = req.body;

    if (otpStore[email] !== otp) {
        return res.json({ success: false, message: "OTP sai" });
    }

    let users = loadUsers();

    if (users.find(u => u.email === email)) {
        return res.json({ success: false, message: "Email tồn tại" });
    }

    users.push({ email, password });
    saveUsers(users);

    delete otpStore[email];

    res.json({ success: true });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    let users = loadUsers();

    let user = users.find(u => u.email === email && u.password === password);

    if (user) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log("Server chạy cổng " + PORT);
});
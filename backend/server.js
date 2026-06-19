require("dotenv").config();

const {Pool} = require("pg");
const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

app.use(cors());
app.use(express.json());

const connection = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

connection.connect().then(() => console.log("Connected"));



const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function checkUserStatus(req, res, next) {
    const userId = req.query.adminId || req.body?.adminId;

    if(!userId || userId === "undefined") return res.status(401).send("Unauthorized access.");

    const query = `SELECT status FROM users WHERE user_id = $1`;

    connection.query(query, [userId], (err, dbRes) => {

        if(err) return res.status(500).send("Server verification error");

        if (dbRes.rows.length === 0 || dbRes.rows[0].status === 'blocked') 
            return res.status(403).send("ACCOUNT_REVOKED");
        
        next();
    });
}



app.post("/register", (req, res) => {
    const { name, email, password } = req.body;
    const token = crypto.randomBytes(32).toString("hex");
    const query = `INSERT INTO users (user_name, user_email, user_password, verification_token) VALUES ($1, $2, $3, $4)`;
    const values = [name, email, password, token];
    
    
    connection.query(query, values,  (err, dbRes) => {
        if(!err) {
            console.log("User saved");
            res.status(201).send("User registered successfully! Please check your email to verify your account.");
            const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
            const verificationLink = `${backendUrl}/verify?token=${token}`;
            
            const mailOptions = {
                from: '"Admin System" <noreply@itransitionproject.com>',
                to: email,
                subject: 'Verify Your Account',
                html: `<p>Thank you for registering. Please click the link below to verify your account:</p>
                <a href="${verificationLink}">${verificationLink}</a>`
            };
            
            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) console.log("Email failed to send:", mailErr.message);
                else console.log("Test email sent! View it at:", nodemailer.getTestMessageUrl(info));
            });
        } else {
            console.log(err.message);
            res.status(400).send(`Registration failed: ${err.message}`);
        }
        
    });   
    
});

app.get("/verify", (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.status(400).send("Invalid verification link.");
    }
  
    const sqlQuery = `
        UPDATE users 
        SET status = 'active', verification_token = NULL 
        WHERE verification_token = $1 AND status = 'unverified'
    `;
    
    connection.query(sqlQuery, [token], (err, dbRes) => {
        if (err) {
            return res.status(500).send("Database error during verification.");
        }
      
        if (dbRes.rowCount === 0) {           
            return res.status(400).send("Verification failed. Link is invalid or account cannot be verified.");
        }
        
        res.send("<h1>Account verified successfully!</h1><p>You can now close this tab and log in.</p>");
    });
});

app.post("/login", (req, res) => {
    const {email, password} = req.body;
    const query = `SELECT * FROM users WHERE user_email = $1`;    

    connection.query(query, [email], (err, dbRes) => {
        if(err) {
            console.log("Database Error:", err.message);
            return res.status(500).send("Internal server error");
        }  

        if (dbRes.rows.length === 0) {
            return res.status(401).send("Invalid email or password.");
        }

        const user = dbRes.rows[0];
        if(user.status === "blocked") {
            return res.status(403).send("Your account is blocked.")
        }       

        if (user.user_password !== password) {
            return res.status(401).send("Invalid email or password.");
        }

        const updateTimeQuery = `UPDATE users SET last_login_time = NOW() WHERE user_id = $1`;

        connection.query(updateTimeQuery, [user.user_id], (updErr, updRes) => {
            if(updErr) {
                console.log("Failed to update login time:", updErr.message);
                return res.status(500).send("Login failed during timestamp update.");
            }

            res.status(200).json({
                message: "Login successful!",
                user: {
                    id: user.user_id,
                    name: user.user_name,
                    email: user.user_email,
                    status: user.status
                }
            });
        });
    });
});

app.get("/users", checkUserStatus, (req, res) => {
    const query = `
    SELECT user_id, user_name, user_email, last_login_time, status
    FROM users
    ORDER BY user_id ASC
    `;

    connection.query(query, (err, dbRes) => {
        if(err) {
            console.log("Failed to fetch users:", err.message);
            return res.status(500).send("Database error");
        }
        res.status(200).json(dbRes.rows);
    });
});

app.post("/users/action", checkUserStatus, (req, res) => {
    const {ids, action} = req.body;

    if(action !== "delete_unverified" && (!ids || ids.length === 0)) {
        return res.status(400).send("No users selected");
    }

    let query = "";
    let queryParams = [ids];

    if(action === "block") {
        query = `UPDATE users SET status = 'blocked' WHERE user_id = ANY($1)`;
    } else if (action === "unblock") {
        query = `
            UPDATE users 
            SET status = CASE 
                WHEN verification_token IS NOT NULL THEN 'unverified' 
                ELSE 'active' 
            END 
            WHERE user_id = ANY($1)
        `;
    } else if(action === "delete") {
        query = `DELETE FROM users WHERE user_id = ANY($1)`;
    } else if (action === "delete_unverified") {
        query = `DELETE FROM users WHERE status = 'unverified'`;
        queryParams = [];
    } else {
        return res.status(400).send("Invalid action.");
    }

    connection.query(query, queryParams, (err, dbRes) => {
        if(err) {
            console.log(`Failed to execute action ${action}`);
            return res.status(500).send("Database action failed.");
        }

        res.status(200).send(`Successfully completed ${action} action`);

    });
});
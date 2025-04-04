const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors');
const PORT = 3000;

// Enable CORS for all origins
app.use(cors());

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage }).any();

app.use(express.static('uploads'));


// Create an endpoint to handle file uploads
app.post('/upload', upload, (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send({ message: 'No files uploaded' });
        }
        res.status(200).send({
            message: 'Files uploaded successfully',
            files: files.map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                path: file.path,
                size: file.size,
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'File upload failed', error });
    }
});

// Create an endpoint that responds after a delay
app.post('/timeout', express.json(), (req, res) => {
    const payload = req.body;
    
    setTimeout(() => {
        res.status(200).json({
            message: 'Response after 30 seconds',
            receivedPayload: payload,
            timestamp: new Date().toISOString()
        });
    }, 30000); // 30 seconds delay
});


// Echo endpoint that reflects back the request body
app.post('/echo', express.json(), (req, res) => {
    res.status(200).json({
        body: req.body,
        timestamp: new Date().toISOString()
    });
});

// Cookie header echo endpoint
app.post('/cookie-echo', express.json(), (req, res) => {
    const cookieHeader = req.headers.cookie || 'No cookies found';
    res.status(200).json({
        cookies: cookieHeader,
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

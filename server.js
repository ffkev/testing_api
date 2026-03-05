const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors');
const PORT = 3000;

// Enable CORS (including Private Network Access for requests from public origins to localhost)
app.use(cors({
    origin: ['http://localhost:5000', 'https://ff-debug-service-frontend-neqmd5szxa-uc.a.run.app'],
    credentials: true,
}));

// Handle Private Network Access preflight header
app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
});

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
        cb(null, file.originalname);
    }
});

const upload = multer({ storage }).any();

app.use(express.static('uploads'));


// Create an endpoint to handle file uploads
app.post('/upload', upload, (req, res) => {
    console.log('\n--- UPLOAD REQUEST ---');
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body fields:', req.body);
    console.log('Files:', req.files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
    })));

    try {
        const files = req.files;
        if (!files || files.length === 0) {
            const response = { message: 'No files uploaded' };
            console.log('Response [400]:', JSON.stringify(response, null, 2));
            console.log('--- END UPLOAD ---\n');
            return res.status(400).send(response);
        }
        const response = {
            message: 'Files uploaded successfully',
            files: files.map(file => ({
                originalName: file.originalname,
                fileName: file.filename,
                path: file.path,
                size: file.size,
            }))
        };
        console.log('Response [200]:', JSON.stringify(response, null, 2));
        console.log('--- END UPLOAD ---\n');
        res.status(200).send(response);
    } catch (error) {
        console.error('Response [500]:', error);
        console.log('--- END UPLOAD ---\n');
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

// Fake user data pool
const generateFakeUsers = () => {
    const firstNames = ['Emma', 'Eve', 'Charles', 'Janet', 'Tobias', 'Byron', 'George', 'Rachel', 'Lindsay', 'Michael', 'Tracey', 'Emma', 'Charles', 'George', 'Lindsay', 'Michael', 'Tobias', 'Byron', 'Janet', 'Rachel'];
    const lastNames = ['Wong', 'Holt', 'Morris', 'Weaver', 'Funke', 'Fields', 'Edwards', 'Howell', 'Ferguson', 'Lawson', 'Ramos', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'];
    const domains = ['reqres.in', 'example.com', 'test.com', 'demo.org'];
    
    const users = [];
    for (let i = 1; i <= 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        users.push({
            id: i,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
            first_name: firstName,
            last_name: lastName,
            avatar: `https://reqres.in/img/faces/${i}-image.jpg`
        });
    }
    return users;
};

const fakeUsers = generateFakeUsers();

// Paginated users endpoint
app.get('/api/users', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const per_page = parseInt(req.query.per_page) || 6;
        
        // Validate pagination parameters
        if (page < 1) {
            return res.status(400).json({ error: 'Page must be greater than 0' });
        }
        if (per_page < 1) {
            return res.status(400).json({ error: 'per_page must be greater than 0' });
        }
        
        // Calculate pagination
        const totalUsers = fakeUsers.length;
        const totalPages = Math.ceil(totalUsers / per_page);
        const startIndex = (page - 1) * per_page;
        const endIndex = startIndex + per_page;
        
        // Rotate data by shifting the start index based on page number
        // This creates a "rotating" effect where different pages show different users
        const rotatedStartIndex = (startIndex + (page - 1) * 2) % totalUsers;
        const paginatedUsers = [];
        
        for (let i = 0; i < per_page; i++) {
            const userIndex = (rotatedStartIndex + i) % totalUsers;
            paginatedUsers.push(fakeUsers[userIndex]);
        }
        
        res.status(200).json(paginatedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // <-- Import MongoDB tools
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// --- PASTE YOUR CONNECTION STRING HERE ---
const connectionString = process.env.MONGO_URI;

// --- Database Variables ---
let db;
let documentsCollection;
let archivesCollection;

// --- Connect to MongoDB Atlas ---
MongoClient.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to Database');
        db = client.db('complianceDB'); // Use a database named "complianceDB"
        documentsCollection = db.collection('documents');
        archivesCollection = db.collection('archives');
    })
    .catch(error => console.error(error));

// --- Middleware & File Storage (No change from before) ---
app.use(express.json());
app.use(express.static(__dirname));
const upload = multer({ dest: 'uploads/' });

// --- NEW API Routes ---

// Get all documents and archives
app.get('/api/documents', async (req, res) => {
    try {
        const documents = await documentsCollection.find().toArray();
        const archives = await archivesCollection.find().toArray();
        res.json({ documents, archives });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data' });
    }
});

// Add or Update a document
app.post('/api/documents', upload.single('attachment'), async (req, res) => {
    const docData = JSON.parse(req.body.document);
    if (req.file) {
        docData.attachmentPath = req.file.path;
    }

    try {
        if (docData._id) { // If it has an ID, it's an update
            const id = docData._id;
            delete docData._id; // MongoDB handles its own _id
            await documentsCollection.updateOne({ _id: new ObjectId(id) }, { $set: docData });
        } else { // No ID means it's a new document
            await documentsCollection.insertOne(docData);
        }
        res.status(200).json({ message: 'Document saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving document' });
    }
});

// Delete a document
app.delete('/api/documents/:id', async (req, res) => {
    try {
        await documentsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
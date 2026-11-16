
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();

app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

const clientPromise = client.connect();

const dbName = process.env.DB_NAME || 'booksdb';

async function getBooksCollection() {
    const connectedClient = await clientPromise;
    const db = connectedClient.db(dbName);
    return db.collection('books');
}

// Home route
app.get('/', (req, res) => {
    res.json({
        message: 'Books API is running successfully!'
    });
});

// CREATE BOOK
app.post('/api/v1/books', async (req, res) => {
    try {
        const collection = await getBooksCollection();

        const newBook = req.body;

        const result = await collection.insertOne(newBook);

        res.status(201).json({
            message: 'Book Created Successfully',
            data: {
                _id: result.insertedId,
                ...newBook
            }
        });

    } catch (err) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

// READ ALL BOOKS
app.get('/api/v1/books', async (req, res) => {
    try {
        const collection = await getBooksCollection();

        const { category } = req.query;

        const query = category ? { category } : {};

        const result = await collection.find(query).toArray();

        res.status(200).json({
            message: 'Books retrieved successfully',
            data: result
        });

    } catch (err) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

// READ BOOK BY ID
app.get('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid Book ID'
            });
        }

        const collection = await getBooksCollection();

        const result = await collection.findOne({
            _id: new ObjectId(id)
        });

        if (!result) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json({
            message: 'Book retrieved successfully',
            data: result
        });

    } catch (err) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

// UPDATE BOOK
app.put('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid Book ID'
            });
        }

        const collection = await getBooksCollection();

        const updatedBook = req.body;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updatedBook },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json({
            message: 'Book updated successfully',
            data: result
        });

    } catch (err) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

// DELETE BOOK
app.delete('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid Book ID'
            });
        }

        const collection = await getBooksCollection();

        const result = await collection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json({
            message: 'Book deleted successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

// 404 ROUTE
app.use((req, res) => {
    res.status(404).json({
        message: 'Route Not Found'
    });
});

// IMPORTANT: Export app for Vercel
export default app;

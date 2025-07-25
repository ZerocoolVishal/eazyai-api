// index.js
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createTask, updateTask, getTask } = require('./tasks');
const { suggestProductInfo } = require('./models/phi4');

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.post('/upload-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const taskId = createTask();
    const filePath = path.join(__dirname, req.file.path);
    processCSVAsync(filePath, taskId).then(() => {
        console.log("Process completed");
    });

    res.json({ message: 'Upload successful', task_id: taskId });
});

app.get('/task/:taskId/status', (req, res) => {
    const task = getTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
});

async function processCSVAsync(filePath, taskId) {
    const records = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            records.push(row);
        })
        .on('end', async () => {
            updateTask(taskId, { status: 'processing', total: records.length });

            const results = [];

            for (let i = 0; i < records.length; i++) {
                const row = records[i];

                if (!row['Title']?.trim()) continue;

                const title = row['Title'];
                const context = (row['Body (HTML)'] || '') + '\n' + (row['Product Category'] || '');

                const aiSuggestions = await suggestProductInfo(title, context);

                results.push({
                    title,
                    original_category: row['Product Category'],
                    ai_suggestions: aiSuggestions,
                });

                updateTask(taskId, { progress: i + 1 });
            }

            updateTask(taskId, {
                status: 'completed',
                results,
                completedAt: new Date(),
            });

            fs.unlinkSync(filePath); // Cleanup
        })
        .on('error', (err) => {
            updateTask(taskId, { status: 'error', error: err.message });
        });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

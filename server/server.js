require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const dbPath = './db.json';

const readData = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Topics API
app.get('/api/topics', (req, res) => {
    const data = readData();
    res.json(data.topics);
});

app.post('/api/topics', (req, res) => {
    const data = readData();
    const newTopic = {
        id: Date.now(),
        text: req.body.text,
        date: req.body.date,
        milestoneId: req.body.milestoneId || null
    };
    data.topics.push(newTopic);
    if (newTopic.milestoneId) {
        const milestone = data.milestones.find(m => m.id == newTopic.milestoneId);
        if (milestone) {
            milestone.topics.push(newTopic.id);
        }
    }
    writeData(data);
    res.status(201).json(newTopic);
});

app.put('/api/topics/:id', (req, res) => {
    const data = readData();
    const { id } = req.params;
    const { text, date, milestoneId } = req.body;
    const topicIndex = data.topics.findIndex(t => t.id == id);
    if (topicIndex > -1) {
        const originalMilestoneId = data.topics[topicIndex].milestoneId;
        data.topics[topicIndex] = { ...data.topics[topicIndex], text, date, milestoneId };

        if (originalMilestoneId !== milestoneId) {
            if (originalMilestoneId) {
                const originalMilestone = data.milestones.find(m => m.id == originalMilestoneId);
                if (originalMilestone) {
                    originalMilestone.topics = originalMilestone.topics.filter(topicId => topicId != id);
                }
            }
            if (milestoneId) {
                const newMilestone = data.milestones.find(m => m.id == milestoneId);
                if (newMilestone) {
                    newMilestone.topics.push(id);
                }
            }
        }
        writeData(data);
        res.json(data.topics[topicIndex]);
    } else {
        res.status(404).send('Topic not found');
    }
});

app.delete('/api/topics/:id', (req, res) => {
    const data = readData();
    const { id } = req.params;
    const topicIndex = data.topics.findIndex(t => t.id == id);
    if (topicIndex > -1) {
        const { milestoneId } = data.topics[topicIndex];
        data.topics.splice(topicIndex, 1);
        if (milestoneId) {
            const milestone = data.milestones.find(m => m.id == milestoneId);
            if (milestone) {
                milestone.topics = milestone.topics.filter(topicId => topicId != id);
            }
        }
        writeData(data);
        res.status(204).send();
    } else {
        res.status(404).send('Topic not found');
    }
});

// Milestones API
app.get('/api/milestones', (req, res) => {
    const data = readData();
    res.json(data.milestones);
});

app.post('/api/milestones', (req, res) => {
    const data = readData();
    const newMilestone = {
        id: Date.now(),
        text: req.body.text,
        date: req.body.date,
        topics: []
    };
    data.milestones.push(newMilestone);
    writeData(data);
    res.status(201).json(newMilestone);
});

app.put('/api/milestones/:id', (req, res) => {
    const data = readData();
    const { id } = req.params;
    const { text, date } = req.body;
    const milestoneIndex = data.milestones.findIndex(m => m.id == id);
    if (milestoneIndex > -1) {
        data.milestones[milestoneIndex] = { ...data.milestones[milestoneIndex], text, date };
        writeData(data);
        res.json(data.milestones[milestoneIndex]);
    } else {
        res.status(404).send('Milestone not found');
    }
});

app.delete('/api/milestones/:id', (req, res) => {
    const data = readData();
    const { id } = req.params;
    const milestoneIndex = data.milestones.findIndex(m => m.id == id);
    if (milestoneIndex > -1) {
        const milestoneId = data.milestones[milestoneIndex].id;
        // Unassign topics associated with the milestone
        data.topics.forEach(topic => {
            if (topic.milestoneId == milestoneId) {
                topic.milestoneId = null;
            }
        });
        data.milestones.splice(milestoneIndex, 1);
        writeData(data);
        res.status(204).send();
    } else {
        res.status(404).send('Milestone not found');
    }
});

app.post('/api/suggestions', async (req, res) => {
    const { milestone } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(400).send('API key is missing. Please set the GEMINI_API_KEY environment variable.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `Generate a short list of 3-5 study topics related to the milestone: "${milestone}". Return the topics as a simple comma-separated list.`
                }]
            }]
        });
        const suggestions = response.data.candidates[0].content.parts[0].text.split(',').map(s => s.trim());
        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to fetch suggestions. Check the server logs for details.');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
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
// Plans API
app.get('/api/plans', (req, res) => {
    const data = readData();
    res.json(data.plans);
});

app.post('/api/plans', (req, res) => {
    const data = readData();
    const newPlan = {
        id: Date.now(),
        name: req.body.name,
        userId: req.body.userId,
        topics: [],
        milestones: [],
        notes: ""
    };
    data.plans.push(newPlan);
    writeData(data);
    res.status(201).json(newPlan);
});

app.get('/api/plans/:planId', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        res.json(plan);
    } else {
        res.status(404).send('Plan not found');
    }
});

app.put('/api/plans/:planId', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        plan.name = req.body.name || plan.name;
        if (req.body.notes !== undefined) {
            plan.notes = req.body.notes;
        }
        if (req.body.userId !== undefined) {
            plan.userId = req.body.userId;
        }
        writeData(data);
        res.json(plan);
    } else {
        res.status(404).send('Plan not found');
    }
});

app.delete('/api/plans/:planId', (req, res) => {
    const data = readData();
    const planIndex = data.plans.findIndex(p => p.id == req.params.planId);
    if (planIndex > -1) {
        data.plans.splice(planIndex, 1);
        writeData(data);
        res.status(204).send();
    } else {
        res.status(404).send('Plan not found');
    }
});

// Topics API (scoped to a plan)
app.get('/api/plans/:planId/topics', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        res.json(plan.topics);
    } else {
        res.status(404).send('Plan not found');
    }
});

app.post('/api/plans/:planId/topics', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        const newTopic = {
            id: Date.now(),
            text: req.body.text,
            date: req.body.date,
            color: req.body.color,
            milestoneId: req.body.milestoneId || null,
            completed: false // Add completed status
        };
        plan.topics.push(newTopic);
        writeData(data);
        res.status(201).json(newTopic);
    } else {
        res.status(404).send('Plan not found');
    }
});

app.put('/api/plans/:planId/topics/:topicId', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        const { topicId } = req.params;
        const { text, date, color, milestoneId, completed } = req.body; // Include completed
        const topicIndex = plan.topics.findIndex(t => t.id == topicId);
        if (topicIndex > -1) {
            plan.topics[topicIndex] = { ...plan.topics[topicIndex], text, date, color, milestoneId, completed };
            writeData(data);
            res.json(plan.topics[topicIndex]);
        } else {
            res.status(404).send('Topic not found');
        }
    } else {
        res.status(404).send('Plan not found');
    }
});

app.delete('/api/plans/:planId/topics/:topicId', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        const { topicId } = req.params;
        const topicIndex = plan.topics.findIndex(t => t.id == topicId);
        if (topicIndex > -1) {
            plan.topics.splice(topicIndex, 1);
            writeData(data);
            res.status(204).send();
        } else {
            res.status(404).send('Topic not found');
        }
    } else {
        res.status(404).send('Plan not found');
    }
});

// Milestones API
// Milestones API (scoped to a plan)
app.get('/api/plans/:planId/milestones', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        res.json(plan.milestones);
    } else {
        res.status(404).send('Plan not found');
    }
});

app.post('/api/plans/:planId/milestones', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        const newMilestone = {
            id: Date.now(),
            text: req.body.text,
            date: req.body.date,
            color: req.body.color
        };
        plan.milestones.push(newMilestone);
        writeData(data);
        res.status(201).json(newMilestone);
    } else {
        res.status(404).send('Plan not found');
    }
});

app.put('/api/plans/:planId/milestones/:milestoneId', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        const { milestoneId } = req.params;
        const { text, date, color } = req.body;
        const milestoneIndex = plan.milestones.findIndex(m => m.id == milestoneId);
        if (milestoneIndex > -1) {
            plan.milestones[milestoneIndex] = { ...plan.milestones[milestoneIndex], text, date, color };
            writeData(data);
            res.json(plan.milestones[milestoneIndex]);
        } else {
            res.status(404).send('Milestone not found');
        }
    } else {
        res.status(404).send('Plan not found');
    }
});

app.delete('/api/plans/:planId/milestones/:milestoneId', (req, res) => {
    const data = readData();
    const plan = data.plans.find(p => p.id == req.params.planId);
    if (plan) {
        const { milestoneId } = req.params;
        const milestoneIndex = plan.milestones.findIndex(m => m.id == milestoneId);
        if (milestoneIndex > -1) {
            // Unassign topics associated with the milestone
            plan.topics.forEach(topic => {
                if (topic.milestoneId == milestoneId) {
                    topic.milestoneId = null;
                }
            });
            plan.milestones.splice(milestoneIndex, 1);
            writeData(data);
            res.status(204).send();
        } else {
            res.status(404).send('Milestone not found');
        }
    } else {
        res.status(404).send('Plan not found');
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

// Generate a unique session token for this server instance
const serverSessionToken = Date.now().toString() + Math.random().toString(36).substr(2, 9);

app.get('/api/session', (req, res) => {
    res.json({ sessionToken: serverSessionToken });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Session token: ${serverSessionToken}`);
});
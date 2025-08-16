document.addEventListener('DOMContentLoaded', () => {
    const topicForm = document.getElementById('add-topic-form');
    const topicInput = document.getElementById('topic-input');
    const topicDateInput = document.getElementById('topic-date-input');
    const topicsList = document.getElementById('topics-list');
    const milestoneForm = document.getElementById('add-milestone-form');
    const milestoneInput = document.getElementById('milestone-input');
    const milestoneDateInput = document.getElementById('milestone-date-input');
    const milestonesList = document.getElementById('milestones-list');
    const milestoneSelect = document.getElementById('milestone-select');
    const calendarEl = document.getElementById('calendar-container');
    
    const suggestionsModal = document.getElementById('suggestions-modal');
    const suggestionsCloseBtn = suggestionsModal.querySelector('.close-btn');
    const suggestionsList = document.getElementById('suggestions-list');
    const addSelectedBtn = document.getElementById('add-selected-topics-btn');

    const editModal = document.getElementById('edit-modal');
    const editCloseBtn = editModal.querySelector('.close-btn');
    const editIdInput = document.getElementById('edit-id-input');
    const editTypeInput = document.getElementById('edit-type-input');
    const editTextInput = document.getElementById('edit-text-input');
    const editDateInput = document.getElementById('edit-date-input');
    const saveEditBtn = document.getElementById('save-edit-btn');

    let currentMilestoneId = null;

    const topicsApiUrl = 'http://localhost:3000/api/topics';
    const milestonesApiUrl = 'http://localhost:3000/api/milestones';

    async function fetchData() {
        try {
            const [topicsRes, milestonesRes] = await Promise.all([
                fetch(topicsApiUrl),
                fetch(milestonesApiUrl)
            ]);
            const topics = await topicsRes.json();
            const milestones = await milestonesRes.json();
            renderAll(topics, milestones);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function renderAll(topics, milestones) {
        renderMilestones(milestones, topics);
        renderTopics(topics);
        populateMilestoneSelect(milestones);
        initializeCalendar(topics, milestones);
    }

    function renderTopics(topics) {
        topicsList.innerHTML = '';
        const unassignedTopics = topics.filter(t => !t.milestoneId);
        unassignedTopics.forEach(topic => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span style="color: #007bff;">${topic.text} - ${topic.date}</span>
                <div>
                    <button class="edit-btn" data-id="${topic.id}" data-type="topic">Edit</button>
                    <button class="delete-btn" data-id="${topic.id}" data-type="topic">Delete</button>
                </div>
            `;
            topicsList.appendChild(li);
        });
    }

    function renderMilestones(milestones, topics) {
        milestonesList.innerHTML = '';
        milestones.forEach(milestone => {
            const li = document.createElement('li');
            li.classList.add('milestone');
            li.innerHTML = `
                <div class="milestone-header">
                    <span style="color: #28a745;">${milestone.text} - ${milestone.date}</span>
                    <div>
                        <button class="edit-btn" data-id="${milestone.id}" data-type="milestone">Edit</button>
                        <button class="delete-btn" data-id="${milestone.id}" data-type="milestone">Delete</button>
                    </div>
                </div>
                <ul class="milestone-topics">
                    ${topics.filter(t => t.milestoneId == milestone.id).map(topic => `
                        <li data-id="${topic.id}">
                            <span style="color: #007bff;">${topic.text} - ${topic.date}</span>
                            <div>
                                <button class="edit-btn" data-id="${topic.id}" data-type="topic">Edit</button>
                                <button class="delete-btn" data-id="${topic.id}" data-type="topic">Delete</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
                <button class="suggestions-btn" data-milestone-id="${milestone.id}" data-milestone-text="${milestone.text}" data-milestone-date="${milestone.date}">Suggestions</button>
            `;
            milestonesList.appendChild(li);
        });
    }

    function populateMilestoneSelect(milestones) {
        milestoneSelect.innerHTML = '<option value="">Assign to Milestone (Optional)</option>';
        milestones.forEach(milestone => {
            const option = document.createElement('option');
            option.value = milestone.id;
            option.textContent = milestone.text;
            option.style.backgroundColor = '#28a745';
            option.style.color = 'white';
            milestoneSelect.appendChild(option);
        });
    }

    topicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTopicText = topicInput.value.trim();
        const newTopicDate = topicDateInput.value;
        const selectedMilestoneId = milestoneSelect.value;
        if (newTopicText && newTopicDate) {
            await fetch(topicsApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newTopicText, date: newTopicDate, milestoneId: selectedMilestoneId || null })
            });
            fetchData();
            topicInput.value = '';
            topicDateInput.value = '';
            milestoneSelect.value = '';
        }
    });

    milestoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newMilestoneText = milestoneInput.value.trim();
        const newMilestoneDate = milestoneDateInput.value;
        if (newMilestoneText && newMilestoneDate) {
            await fetch(milestonesApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMilestoneText, date: newMilestoneDate })
            });
            fetchData();
            milestoneInput.value = '';
            milestoneDateInput.value = '';
        }
    });

    document.body.addEventListener('click', async (e) => {
        const milestoneHeader = e.target.closest('.milestone-header');
        if (milestoneHeader) {
            milestoneHeader.closest('.milestone').classList.toggle('expanded');
        }

        if (e.target.classList.contains('delete-btn')) {
            const { id, type } = e.target.dataset;
            const url = type === 'topic' ? `${topicsApiUrl}/${id}` : `${milestonesApiUrl}/${id}`;
            await fetch(url, { method: 'DELETE' });
            fetchData();
        }

        if (e.target.classList.contains('edit-btn')) {
            const { id, type } = e.target.dataset;
            const isTopic = type === 'topic';
            const url = isTopic ? topicsApiUrl : milestonesApiUrl;
            
            const res = await fetch(url);
            const items = await res.json();
            const item = items.find(i => i.id == id);

            editIdInput.value = id;
            editTypeInput.value = type;
            editTextInput.value = item.text;
            editDateInput.value = item.date;
            editModal.style.display = 'block';
        }

        if (e.target.classList.contains('suggestions-btn')) {
            currentMilestoneId = e.target.dataset.milestoneId;
            const milestoneText = e.target.dataset.milestoneText;
            const milestoneDate = e.target.dataset.milestoneDate;
            fetchSuggestions(milestoneText, milestoneDate);
        }
    });

    async function fetchSuggestions(milestoneText, milestoneDate) {
        const res = await fetch('http://localhost:3000/api/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ milestone: milestoneText })
        });
        const suggestions = await res.json();
        
        const topicsRes = await fetch(topicsApiUrl);
        const existingTopics = await topicsRes.json();
        const milestoneTopics = existingTopics.filter(t => t.milestoneId == currentMilestoneId).map(t => t.text.toLowerCase());

        suggestionsList.innerHTML = '';
        suggestions.filter(s => !milestoneTopics.includes(s.toLowerCase())).forEach(suggestion => {
            suggestionsList.innerHTML += `
                <label>
                    <input type="checkbox" value="${suggestion}"> ${suggestion}
                </label>
            `;
        });
        suggestionsModal.style.display = 'block';
    }

    suggestionsCloseBtn.onclick = () => suggestionsModal.style.display = 'none';
    editCloseBtn.onclick = () => editModal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target == suggestionsModal || e.target == editModal) {
            suggestionsModal.style.display = 'none';
            editModal.style.display = 'none';
        }
    };

    addSelectedBtn.onclick = async () => {
        const selectedTopics = Array.from(suggestionsList.querySelectorAll('input:checked')).map(input => input.value);
        const milestoneDate = document.querySelector(`.suggestions-btn[data-milestone-id='${currentMilestoneId}']`).dataset.milestoneDate;

        for (const topicText of selectedTopics) {
            await fetch(topicsApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: topicText, date: milestoneDate, milestoneId: currentMilestoneId })
            });
        }
        fetchData();
        suggestionsModal.style.display = 'none';
    };

    saveEditBtn.onclick = async () => {
        const id = editIdInput.value;
        const type = editTypeInput.value;
        const newText = editTextInput.value;
        const newDate = editDateInput.value;
        const isTopic = type === 'topic';
        const url = isTopic ? `${topicsApiUrl}/${id}` : `${milestonesApiUrl}/${id}`;

        const res = await fetch(isTopic ? topicsApiUrl : milestonesApiUrl);
        const items = await res.json();
        const item = items.find(i => i.id == id);

        const body = { text: newText, date: newDate };
        if (isTopic) {
            body.milestoneId = item.milestoneId;
        }

        await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        fetchData();
        editModal.style.display = 'none';
    };

    function initializeCalendar(topics, milestones) {
        const events = [
            ...topics.map(t => ({ id: `topic-${t.id}`, title: t.text, start: t.date, allDay: true, backgroundColor: '#007bff', borderColor: '#007bff' })),
            ...milestones.map(m => ({ id: `milestone-${m.id}`, title: m.text, start: m.date, allDay: true, backgroundColor: '#28a745', borderColor: '#28a745' }))
        ];

        if (window.calendar) {
            window.calendar.destroy();
        }
        window.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            events: events,
            eventDisplay: 'block'
        });
        window.calendar.render();
    }

    fetchData();
});
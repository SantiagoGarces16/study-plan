const { createApp } = Vue;

createApp({
    data() {
        return {
            topics: [],
            milestones: [],
            newTopic: { text: '', date: '', milestoneId: '' },
            newMilestone: { text: '', date: '' },
            showEditModal: false,
            showSuggestionsModal: false,
            editingItem: {},
            editingType: '',
            suggestions: [],
            selectedSuggestions: [],
            currentMilestone: null,
            appTitle: 'Career Study Plan',
            theme: 'light',
            loadingSuggestions: false,
            topicsApiUrl: 'http://localhost:3000/api/topics',
            milestonesApiUrl: 'http://localhost:3000/api/milestones',
            suggestionsApiUrl: 'http://localhost:3000/api/suggestions',
        };
    },
    computed: {
        unassignedTopics() {
            return this.topics.filter(t => !t.milestoneId);
        }
    },
    methods: {
        async fetchData() {
            try {
                const [topicsRes, milestonesRes] = await Promise.all([
                    fetch(this.topicsApiUrl),
                    fetch(this.milestonesApiUrl)
                ]);
                this.topics = await topicsRes.json();
                this.milestones = (await milestonesRes.json()).map(m => ({ ...m, expanded: false }));
                this.initializeCalendar();
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        },
        getTopicsForMilestone(milestoneId) {
            return this.topics.filter(t => t.milestoneId == milestoneId);
        },
        toggleMilestone(milestoneId) {
            const milestone = this.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.expanded = !milestone.expanded;
            }
        },
        async addTopic() {
            if (this.newTopic.text && this.newTopic.date) {
                await fetch(this.topicsApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...this.newTopic, milestoneId: this.newTopic.milestoneId || null })
                });
                this.newTopic = { text: '', date: '', milestoneId: '' };
                this.fetchData();
            }
        },
        async addMilestone() {
            if (this.newMilestone.text && this.newMilestone.date) {
                await fetch(this.milestonesApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.newMilestone)
                });
                this.newMilestone = { text: '', date: '' };
                this.fetchData();
            }
        },
        async deleteItem(type, id) {
            const url = type === 'topic' ? `${this.topicsApiUrl}/${id}` : `${this.milestonesApiUrl}/${id}`;
            await fetch(url, { method: 'DELETE' });
            this.fetchData();
        },
        openEditModal(type, item) {
            this.editingType = type;
            this.editingItem = { ...item };
            this.showEditModal = true;
        },
        async saveEdit() {
            const { id } = this.editingItem;
            const isTopic = this.editingType === 'topic';
            const url = isTopic ? `${this.topicsApiUrl}/${id}` : `${this.milestonesApiUrl}/${id}`;
            
            const body = { text: this.editingItem.text, date: this.editingItem.date };
            if (isTopic) {
                body.milestoneId = this.editingItem.milestoneId;
            }

            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            this.closeModals();
            this.fetchData();
        },
        async fetchSuggestions(milestone) {
            this.currentMilestone = milestone;
            this.loadingSuggestions = true;
            this.showSuggestionsModal = true;
            try {
                const res = await fetch(this.suggestionsApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ milestone: milestone.text })
                });
                const suggestions = await res.json();
                const milestoneTopics = this.getTopicsForMilestone(milestone.id).map(t => t.text.toLowerCase());
                const filteredSuggestions = suggestions.filter(s => !milestoneTopics.includes(s.toLowerCase()));
                
                if (filteredSuggestions.length === 0) {
                    this.suggestions = ["No new suggestions found."];
                } else {
                    this.suggestions = filteredSuggestions;
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                this.suggestions = [];
            } finally {
                this.loadingSuggestions = false;
            }
        },
        async addSelectedTopics() {
            for (const topicText of this.selectedSuggestions) {
                await fetch(this.topicsApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: topicText, 
                        date: this.currentMilestone.date, 
                        milestoneId: this.currentMilestone.id 
                    })
                });
            }
            this.closeModals();
            this.fetchData();
        },
        closeModals() {
            this.showEditModal = false;
            this.showSuggestionsModal = false;
            this.editingItem = {};
            this.suggestions = [];
            this.selectedSuggestions = [];
            this.currentMilestone = null;
        },
        initializeCalendar() {
            const events = [
                ...this.topics.map(t => ({ title: t.text, start: t.date, allDay: true, classNames: ['topic-event'] })),
                ...this.milestones.map(m => ({ title: m.text, start: m.date, allDay: true, classNames: ['milestone-event'] }))
            ];
            
            if (this.calendar) {
                this.calendar.destroy();
            }
            this.calendar = new FullCalendar.Calendar(document.getElementById('calendar-container'), {
                initialView: 'dayGridMonth',
                events: events
            });
            this.calendar.render();
        },
        setTheme(newTheme) {
            this.theme = newTheme;
            document.body.className = `${newTheme}-theme`;
        }
    },
    mounted() {
        this.fetchData();
        this.setTheme(this.theme);
    }
}).mount('#app');
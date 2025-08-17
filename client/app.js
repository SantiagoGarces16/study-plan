const { createApp, ref, onMounted, computed } = Vue;

const App = {
    template: `
        <div class="app-layout">
            <div v-if="currentView === 'mainMenu'">
                <header class="app-header">
                    <h1>Select a Career Plan</h1>
                </header>
                <main class="main-menu-content">
                    <div class="card">
                        <h2>Existing Plans</h2>
                        <ul>
                            <li v-for="plan in plans" :key="plan.id" @click="selectPlan(plan.id)" class="plan-item">
                                <span>{{ plan.name }}</span>
                                <button @click.stop="deletePlan(plan.id)" class="delete-btn">Delete</button>
                            </li>
                        </ul>
                    </div>
                    <div class="card">
                        <h2>Create New Plan</h2>
                        <form @submit.prevent="addPlan">
                            <input v-model="newPlanName" placeholder="New plan name" required>
                            <button type="submit">Create and Open Plan</button>
                        </form>
                    </div>
                </main>
            </div>

            <div v-if="currentView === 'planView' && selectedPlan">
                <header class="app-header">
                    <button @click="goToMainMenu">&larr; Back to Main Menu</button>
                    <input type="text" v-model="selectedPlan.name" class="app-title-input">
                    <div class="theme-selector">
                        <button @click="setTheme('theme-light')">Light</button>
                        <button @click="setTheme('theme-dark')">Dark</button>
                    </div>
                </header>
                <main class="app-content">
                    <div class="milestones-section">
                        <h2>Milestones</h2>
                        <form @submit.prevent="addMilestone">
                            <input v-model="newMilestone.text" placeholder="New milestone" required>
                            <input v-model="newMilestone.date" type="date" required>
                            <input v-model="newMilestone.color" type="color">
                            <button type="submit">Add Milestone</button>
                        </form>
                        <ul>
                            <li v-for="milestone in selectedPlan.milestones" :key="milestone.id" class="milestone item-container" :style="{ borderColor: milestone.color }">
                                <div class="milestone-header" @click="toggleMilestone(milestone.id)">
                                    <span>{{ milestone.text }} - {{ milestone.date }}</span>
                                    <div class="item-actions">
                                        <button @click.stop="openEditModal('milestone', milestone)">Edit</button>
                                        <button @click.stop="deleteItem('milestone', milestone.id)" class="delete-btn">Delete</button>
                                        <button @click.stop="fetchSuggestions(milestone)" class="suggestions-btn">Suggestions</button>
                                    </div>
                                </div>
                                <ul v-if="milestone.expanded" class="milestone-topics">
                                    <li v-for="topic in getTopicsForMilestone(milestone.id)" :key="topic.id" class="topic item-container" :style="{ borderColor: topic.color }">
                                        <span>{{ topic.text }} - {{ topic.date }}</span>
                                        <div class="item-actions">
                                            <button @click.stop="openEditModal('topic', topic)">Edit</button>
                                            <button @click.stop="deleteItem('topic', topic.id)" class="delete-btn">Delete</button>
                                        </div>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div class="main-content">
                        <div class="topics-section">
                            <h2>Topics</h2>
                            <form @submit.prevent="addTopic">
                                <input v-model="newTopic.text" placeholder="New topic" required>
                                <input v-model="newTopic.date" type="date" required>
                                <input v-model="newTopic.color" type="color">
                                <select v-model="newTopic.milestoneId">
                                    <option value="">Assign to Milestone</option>
                                    <option v-for="milestone in selectedPlan.milestones" :value="milestone.id">{{ milestone.text }}</option>
                                </select>
                                <button type="submit">Add Topic</button>
                            </form>
                            <ul>
                                <li v-for="topic in unassignedTopics" :key="topic.id" class="topic item-container" :style="{ borderColor: topic.color }">
                                    <span>{{ topic.text }} - {{ topic.date }}</span>
                                    <div class="item-actions">
                                        <button @click.stop="openEditModal('topic', topic)">Edit</button>
                                        <button @click.stop="deleteItem('topic', topic.id)" class="delete-btn">Delete</button>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div class="calendar-section">
                            <h2>Calendar</h2>
                            <div id="calendar-container" ref="calendar"></div>
                        </div>
                    </div>
                </main>
            </div>

            <!-- Modals -->
            <div v-if="showEditModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" @click="closeModals">&times;</span>
                    <h2>Edit Item</h2>
                    <input v-model="editingItem.text">
                    <input v-model="editingItem.date" type="date">
                    <input v-model="editingItem.color" type="color">
                    <button @click="saveEdit">Save Changes</button>
                </div>
            </div>

            <div v-if="showSuggestionsModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" @click="closeModals">&times;</span>
                    <h2>Suggested Topics</h2>
                    <div v-if="loadingSuggestions">Loading...</div>
                    <div v-else id="suggestions-list">
                        <label v-for="suggestion in suggestions" :key="suggestion">
                            <input type="checkbox" :value="suggestion" v-model="selectedSuggestions"> {{ suggestion }}
                        </label>
                    </div>
                    <button @click="addSelectedTopics" :disabled="loadingSuggestions">Add Selected Topics</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const currentView = ref('mainMenu');
        const theme = ref('theme-light');
        const plans = ref([]);
        const selectedPlan = ref(null);
        const newPlanName = ref('');
        const newTopic = ref({ text: '', date: '', color: '#f1c40f', milestoneId: '' });
        const newMilestone = ref({ text: '', date: '', color: '#9b59b6' });
        const showEditModal = ref(false);
        const showSuggestionsModal = ref(false);
        const editingItem = ref({});
        const editingType = ref('');
        const suggestions = ref([]);
        const selectedSuggestions = ref([]);
        const currentMilestone = ref(null);
        const loadingSuggestions = ref(false);
        const calendar = ref(null);
        let calendarInstance = null;

        const unassignedTopics = computed(() => {
            if (!selectedPlan.value) return [];
            return selectedPlan.value.topics.filter(t => !t.milestoneId);
        });

        const fetchPlans = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/plans');
                plans.value = await res.json();
            } catch (error) {
                console.error('Error fetching plans:', error);
            }
        };

        const selectPlan = async (planId) => {
            try {
                const res = await fetch(`http://localhost:3000/api/plans/${planId}`);
                selectedPlan.value = await res.json();
                currentView.value = 'planView';
                setTimeout(initializeCalendar, 0);
            } catch (error) {
                console.error('Error loading plan:', error);
            }
        };

        const addPlan = async () => {
            if (!newPlanName.value) return;
            try {
                const res = await fetch('http://localhost:3000/api/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newPlanName.value })
                });
                const newPlan = await res.json();
                newPlanName.value = '';
                await fetchPlans();
                selectPlan(newPlan.id);
            } catch (error) {
                console.error('Error adding plan:', error);
            }
        };

        const deletePlan = async (planId) => {
            try {
                await fetch(`http://localhost:3000/api/plans/${planId}`, { method: 'DELETE' });
                fetchPlans();
            } catch (error) {
                console.error('Error deleting plan:', error);
            }
        };
        
        const goToMainMenu = () => {
            currentView.value = 'mainMenu';
            selectedPlan.value = null;
            fetchPlans();
        };

        const getTopicsForMilestone = (milestoneId) => {
            if (!selectedPlan.value) return [];
            return selectedPlan.value.topics.filter(t => t.milestoneId == milestoneId);
        };

        const toggleMilestone = (milestoneId) => {
            const milestone = selectedPlan.value.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.expanded = !milestone.expanded;
            }
        };

        const addTopic = async () => {
            if (newTopic.value.text && newTopic.value.date) {
                const topicData = { ...newTopic.value };
                if (!topicData.milestoneId) {
                    delete topicData.milestoneId;
                } else {
                    const milestone = selectedPlan.value.milestones.find(m => m.id == topicData.milestoneId);
                    if (milestone) {
                        topicData.color = milestone.color;
                    }
                }
                await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/topics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(topicData)
                });
                newTopic.value = { text: '', date: '', color: '#f1c40f', milestoneId: '' };
                selectPlan(selectedPlan.value.id);
            }
        };

        const addMilestone = async () => {
            if (newMilestone.value.text && newMilestone.value.date) {
                await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMilestone.value)
                });
                newMilestone.value = { text: '', date: '', color: '#9b59b6' };
                selectPlan(selectedPlan.value.id);
            }
        };

        const deleteItem = async (type, id) => {
            const url = type === 'topic' 
                ? `http://localhost:3000/api/plans/${selectedPlan.value.id}/topics/${id}` 
                : `http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones/${id}`;
            await fetch(url, { method: 'DELETE' });
            selectPlan(selectedPlan.value.id);
        };

        const openEditModal = (type, item) => {
            editingType.value = type;
            editingItem.value = { ...item };
            showEditModal.value = true;
        };

        const saveEdit = async () => {
            const { id } = editingItem.value;
            const isTopic = editingType.value === 'topic';
            const url = isTopic 
                ? `http://localhost:3000/api/plans/${selectedPlan.value.id}/topics/${id}` 
                : `http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones/${id}`;
            
            const body = { 
                text: editingItem.value.text, 
                date: editingItem.value.date, 
                color: editingItem.value.color 
            };
            if (isTopic) {
                body.milestoneId = editingItem.value.milestoneId;
            }

            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            closeModals();
            selectPlan(selectedPlan.value.id);
        };

        const fetchSuggestions = async (milestone) => {
            currentMilestone.value = milestone;
            loadingSuggestions.value = true;
            showSuggestionsModal.value = true;
            try {
                const res = await fetch('http://localhost:3000/api/suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ milestone: milestone.text })
                });
                const fetchedSuggestions = await res.json();
                const milestoneTopics = getTopicsForMilestone(milestone.id).map(t => t.text.toLowerCase());
                const filteredSuggestions = fetchedSuggestions.filter(s => !milestoneTopics.includes(s.toLowerCase()));
                
                if (filteredSuggestions.length === 0) {
                    suggestions.value = ["No new suggestions found."];
                } else {
                    suggestions.value = filteredSuggestions;
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                suggestions.value = [];
            } finally {
                loadingSuggestions.value = false;
            }
        };

        const addSelectedTopics = async () => {
            for (const topicText of selectedSuggestions.value) {
                if (topicText === "No new suggestions found.") continue;
                await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/topics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text: topicText, 
                        date: currentMilestone.value.date, 
                        milestoneId: currentMilestone.value.id,
                        color: currentMilestone.value.color
                    })
                });
            }
            closeModals();
            selectPlan(selectedPlan.value.id);
        };

        const closeModals = () => {
            showEditModal.value = false;
            showSuggestionsModal.value = false;
            editingItem.value = {};
            suggestions.value = [];
            selectedSuggestions.value = [];
            currentMilestone.value = null;
        };

        const initializeCalendar = () => {
            if (!selectedPlan.value || !calendar.value) return;
            const events = [
                ...selectedPlan.value.topics.map(t => ({ title: t.text, start: t.date, allDay: true, backgroundColor: t.color, borderColor: t.color })),
                ...selectedPlan.value.milestones.map(m => ({ title: m.text, start: m.date, allDay: true, backgroundColor: m.color, borderColor: m.color }))
            ];
            
            if (calendarInstance) {
                calendarInstance.destroy();
            }
            calendarInstance = new FullCalendar.Calendar(calendar.value, {
                initialView: 'dayGridMonth',
                events: events
            });
            calendarInstance.render();
        };

        const setTheme = (newTheme) => {
            theme.value = newTheme;
            document.body.className = newTheme;
        };

        onMounted(() => {
            fetchPlans();
            setTheme(theme.value);
        });

        return {
            currentView,
            theme,
            plans,
            selectedPlan,
            newPlanName,
            newTopic,
            newMilestone,
            showEditModal,
            showSuggestionsModal,
            editingItem,
            suggestions,
            selectedSuggestions,
            loadingSuggestions,
            unassignedTopics,
            calendar,
            selectPlan,
            addPlan,
            deletePlan,
            goToMainMenu,
            getTopicsForMilestone,
            toggleMilestone,
            addTopic,
            addMilestone,
            deleteItem,
            openEditModal,
            saveEdit,
            fetchSuggestions,
            addSelectedTopics,
            closeModals,
            setTheme
        };
    }
};

createApp(App).mount('#app');
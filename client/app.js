const { createApp, ref, onMounted, computed, nextTick } = Vue;

const app = createApp({
    template: `
        <div class="app-layout">
            <div v-if="loading">Loading...</div>
            <div v-if="!loading && currentView === 'mainMenu'">
                <header class="app-header">
                    <h1>Select a Career Plan</h1>
                    <div class="theme-selector">
                        <button @click="setTheme('theme-light')">Light</button>
                        <button @click="setTheme('theme-dark')">Dark</button>
                    </div>
                </header>
                <main class="main-menu-content">
                    <div class="card full-width">
                        <h2>Create New Plan</h2>
                        <form @submit.prevent="addPlan" class="create-plan-form">
                            <input v-model="newPlanName" placeholder="New plan name" required>
                            <button type="submit">Create and Open Plan</button>
                        </form>
                    </div>
                    <div class="card full-width">
                        <h2>All Plans</h2>
                        <ul class="plan-list">
                            <li v-for="plan in plans" :key="plan.id" class="plan-item-container" @click="togglePlanDetails(plan.id)">
                                <div class="plan-item">
                                    <span>{{ plan.name }}</span>
                                    <small v-if="plan.lastEdited">Last Edited: {{ new Date(plan.lastEdited).toLocaleDateString() }}</small>
                                </div>
                                <div v-if="expandedPlanId === plan.id" class="plan-details">
                                    <p>{{ plan.summary }}</p>
                                    <progress-circle :segments="plan.progressSegments"></progress-circle>
                                    <div class="plan-actions">
                                        <button @click.stop="enterPlanView(plan.id)">Open Plan</button>
                                        <button @click.stop="deletePlan(plan.id)" class="delete-btn">Delete</button>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </main>
            </div>

            <div v-if="currentView === 'planView' && selectedPlan">
                <header class="app-header">
                    <button @click="goToMainMenu">&larr; Back to Main Menu</button>
                    <h1 v-if="!editingPlanName" @click="startEditingPlanName">{{ selectedPlan.name }}</h1>
                    <input v-if="editingPlanName" type="text" v-model="planName" @blur="updatePlanName" @keyup.enter="updatePlanName" ref="planNameInput">
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
                            <li v-for="milestone in selectedPlan.milestones" :key="milestone.id" class="milestone item-container" :style="{ borderColor: milestone.color }" :data-id="milestone.id">
                                <div class="milestone-header" @click="toggleMilestone(milestone.id)">
                                    <span>{{ milestone.text }} - {{ milestone.date }}</span>
                                    <div class="item-actions">
                                        <button @click.stop="openEditModal('milestone', milestone)">Edit</button>
                                        <button @click.stop="deleteItem('milestone', milestone.id)" class="delete-btn">Delete</button>
                                        <button @click.stop="fetchSuggestions(milestone)" class="suggestions-btn">Suggestions</button>
                                    </div>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar">
                                        <div v-for="segment in getMilestoneProgress(milestone.id)" :style="{ width: segment.percentage + '%', backgroundColor: segment.color }" class="progress-bar-segment"></div>
                                    </div>
                                </div>
                                <ul v-if="milestone.expanded" class="milestone-topics" :data-milestone-id="milestone.id">
                                    <li v-for="topic in getTopicsForMilestone(milestone.id)" :key="topic.id" class="topic item-container" :style="{ borderColor: topic.color }" :data-id="topic.id">
                                        <input type="checkbox" :checked="topic.completed" @change="toggleTopicCompletion(topic)">
                                        <span :class="{ completed: topic.completed }">{{ topic.text }} - {{ topic.date }}</span>
                                        <div class="item-actions">
                                            <button @click.stop="openEditModal('topic', topic)">Edit</button>
                                            <button @click.stop="deleteItem('topic', topic.id)" class="delete-btn">Delete</button>
                                        </div>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
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
                            <li v-for="topic in unassignedTopics" :key="topic.id" class="topic item-container" :style="{ borderColor: topic.color }" :data-id="topic.id">
                                <input type="checkbox" :checked="topic.completed" @change="toggleTopicCompletion(topic)">
                                <span :class="{ completed: topic.completed }">{{ topic.text }} - {{ topic.date }}</span>
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
                    <div class="right-sidebar">
                        <div class="progress-circle-section">
                            <h2>Overall Progress</h2>
                            <progress-circle :segments="overallProgressSegments"></progress-circle>
                        </div>
                        <div class="notepad-section">
                            <h2>Notepad</h2>
                            <textarea v-model="selectedPlan.notes" @blur="updatePlanNotes" class="notes-textarea"></textarea>
                        </div>
                    </div>
                </main>
            </div>

            <!-- Modals -->
            <div v-if="showEditTopicModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" @click="closeModals">&times;</span>
                    <h2>Edit Topic</h2>
                    <div class="form-group">
                        <label>Text:</label>
                        <input v-model="editingItem.text">
                    </div>
                    <div class="form-group">
                        <label>Date:</label>
                        <input v-model="editingItem.date" type="date">
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <input v-model="editingItem.color" type="color">
                    </div>
                    <div class="form-group">
                        <label>Milestone:</label>
                        <select v-model="editingItem.milestoneId">
                            <option value="">None</option>
                            <option v-for="milestone in selectedPlan.milestones" :value="milestone.id">{{ milestone.text }}</option>
                        </select>
                    </div>
                    <button @click="saveEdit">Save Changes</button>
                </div>
            </div>

            <div v-if="showEditMilestoneModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" @click="closeModals">&times;</span>
                    <h2>Edit Milestone</h2>
                    <div class="form-group">
                        <label>Text:</label>
                        <input v-model="editingItem.text">
                    </div>
                    <div class="form-group">
                        <label>Date:</label>
                        <input v-model="editingItem.date" type="date">
                    </div>
                    <div class="form-group">
                        <label>Color:</label>
                        <input v-model="editingItem.color" type="color">
                    </div>
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
        const showEditTopicModal = ref(false);
        const showEditMilestoneModal = ref(false);
        const showSuggestionsModal = ref(false);
        const editingItem = ref({});
        const editingType = ref('');
        const editingPlanName = ref(false);
        const planName = ref('');
        const planNameInput = ref(null);
        const suggestions = ref([]);
        const selectedSuggestions = ref([]);
        const currentMilestone = ref(null);
        const loadingSuggestions = ref(false);
        const calendar = ref(null);
        let calendarInstance = null;
       const loading = ref(true);
       const expandedPlanId = ref(null);

        const overallProgressSegments = computed(() => {
            if (!selectedPlan.value || !selectedPlan.value.topics || selectedPlan.value.topics.length === 0) {
                return [{ color: '#e0e0e0', percentage: 100 }];
            }
            const topics = selectedPlan.value.topics;
            const completedTopics = topics.filter(t => t.completed);
            if (completedTopics.length === 0) {
                return [{ color: '#e0e0e0', percentage: 100 }];
            }

            const colorGroups = completedTopics.reduce((acc, topic) => {
                acc[topic.color] = (acc[topic.color] || 0) + 1;
                return acc;
            }, {});

            const totalTopics = topics.length;
            return Object.entries(colorGroups).map(([color, count]) => ({
                color,
                percentage: (count / totalTopics) * 100
            }));
        });

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
            } finally {
               loading.value = false;
            }
        };

        const togglePlanDetails = async (planId) => {
            if (expandedPlanId.value === planId) {
                expandedPlanId.value = null;
            } else {
                try {
                    const res = await fetch(`http://localhost:3000/api/plans/${planId}`);
                    const plan = await res.json();
                    
                    const topicCount = plan.topics ? plan.topics.length : 0;
                    const milestoneCount = plan.milestones ? plan.milestones.length : 0;
                    const completedTopics = plan.topics ? plan.topics.filter(t => t.completed) : [];
                    plan.summary = `${milestoneCount} milestones, ${topicCount} topics.`;

                    if (completedTopics.length === 0) {
                        plan.progressSegments = [{ color: '#e0e0e0', percentage: 100 }];
                    } else {
                        const colorGroups = completedTopics.reduce((acc, topic) => {
                            acc[topic.color] = (acc[topic.color] || 0) + 1;
                            return acc;
                        }, {});
                        plan.progressSegments = Object.entries(colorGroups).map(([color, count]) => ({
                            color,
                            percentage: (count / topicCount) * 100
                        }));
                    }

                    const index = plans.value.findIndex(p => p.id === planId);
                    if (index !== -1) {
                        plans.value[index] = { ...plans.value[index], ...plan };
                    }
                    
                    expandedPlanId.value = planId;
                } catch (error) {
                    console.error('Error fetching plan details:', error);
                }
            }
        };

        const enterPlanView = async (planId) => {
            try {
                const res = await fetch(`http://localhost:3000/api/plans/${planId}`);
                selectedPlan.value = await res.json();
                planName.value = selectedPlan.value.name;
                currentView.value = 'planView';
                await nextTick();
                initializeCalendar();
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
                    body: JSON.stringify({ name: newPlanName.value, lastEdited: new Date().toISOString() })
                });
                const newPlan = await res.json();
                newPlanName.value = '';
                await fetchPlans();
                enterPlanView(newPlan.id);
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

        
        const startEditingPlanName = async () => {
            editingPlanName.value = true;
            await nextTick();
            planNameInput.value.focus();
        };

        const updatePlanName = async () => {
            if (!selectedPlan.value || planName.value === selectedPlan.value.name) {
                editingPlanName.value = false;
                return;
            }
            selectedPlan.value.name = planName.value;
            await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: selectedPlan.value.name, lastEdited: new Date().toISOString() })
            });
            editingPlanName.value = false;
        };

        const updatePlanNotes = async () => {
            if (!selectedPlan.value) return;
            await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: selectedPlan.value.notes, lastEdited: new Date().toISOString() })
            });
        };
        
        const goToMainMenu = () => {
            currentView.value = 'mainMenu';
            selectedPlan.value = null;
            expandedPlanId.value = null; // Reset expanded plan
            fetchPlans(); // This will refresh the data
        };

        const getTopicsForMilestone = (milestoneId) => {
            if (!selectedPlan.value) return [];
            return selectedPlan.value.topics.filter(t => t.milestoneId == milestoneId);
        };

        const getMilestoneProgress = (milestoneId) => {
            const topics = getTopicsForMilestone(milestoneId);
            if (topics.length === 0) return [];

            const completedTopics = topics.filter(t => t.completed);
            if (completedTopics.length === 0) return [{ color: '#e0e0e0', percentage: 100 }];

            const colorGroups = completedTopics.reduce((acc, topic) => {
                acc[topic.color] = (acc[topic.color] || 0) + 1;
                return acc;
            }, {});

            const totalTopics = topics.length;
            return Object.entries(colorGroups).map(([color, count]) => ({
                color,
                percentage: (count / totalTopics) * 100
            }));
        };

        const toggleMilestone = (milestoneId) => {
            const milestone = selectedPlan.value.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.expanded = !milestone.expanded;
            }
        };

        const addTopic = async () => {
            if (newTopic.value.text && newTopic.value.date) {
                const topicData = { ...newTopic.value, completed: false };
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
                    body: JSON.stringify({ ...topicData, lastEdited: new Date().toISOString() })
                });
                newTopic.value = { text: '', date: '', color: '#f1c40f', milestoneId: '' };
                const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
                selectedPlan.value = await res.json();
            }
        };

        const addMilestone = async () => {
            if (newMilestone.value.text && newMilestone.value.date) {
                await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...newMilestone.value, lastEdited: new Date().toISOString() })
                });
                newMilestone.value = { text: '', date: '', color: '#9b59b6' };
                const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
                selectedPlan.value = await res.json();
            }
        };

        const deleteItem = async (type, id) => {
            const url = type === 'topic' 
                ? `http://localhost:3000/api/plans/${selectedPlan.value.id}/topics/${id}` 
                : `http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones/${id}`;
            await fetch(url, { method: 'DELETE' });
            const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
            selectedPlan.value = await res.json();
        };

        const openEditModal = (type, item) => {
            editingType.value = type;
            editingItem.value = { ...item };
            if (type === 'topic') {
                showEditTopicModal.value = true;
            } else {
                showEditMilestoneModal.value = true;
            }
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
                body.completed = editingItem.value.completed;
            }

            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, lastEdited: new Date().toISOString() })
            });
            closeModals();
            const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
            selectedPlan.value = await res.json();
        };

        const toggleTopicCompletion = async (topic) => {
            const topicToUpdate = selectedPlan.value.topics.find(t => t.id === topic.id);
            if (topicToUpdate) {
                topicToUpdate.completed = !topicToUpdate.completed;
            }

            await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/topics/${topic.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...topicToUpdate, lastEdited: new Date().toISOString() })
            });

            initializeCalendar();
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
                        color: currentMilestone.value.color,
                        completed: false
                    })
                });
            }
            closeModals();
            const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
            selectedPlan.value = await res.json();
        };

        const closeModals = () => {
            showEditTopicModal.value = false;
            showEditMilestoneModal.value = false;
            showSuggestionsModal.value = false;
            editingItem.value = {};
            suggestions.value = [];
            selectedSuggestions.value = [];
            currentMilestone.value = null;
        };

        const initializeCalendar = () => {
            if (!selectedPlan.value || !calendar.value) return;
            const events = [
                ...selectedPlan.value.topics.map(t => ({ title: t.text, start: t.date, allDay: true, backgroundColor: t.color, borderColor: t.color, classNames: [t.completed ? 'completed-event' : ''] })),
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
            showEditTopicModal,
            showEditMilestoneModal,
            showSuggestionsModal,
            editingItem,
            suggestions,
            selectedSuggestions,
            loadingSuggestions,
            unassignedTopics,
            calendar,
            loading,
            expandedPlanId,
            togglePlanDetails,
            enterPlanView,
            addPlan,
            deletePlan,
            editingPlanName,
            planName,
            planNameInput,
            startEditingPlanName,
            updatePlanName,
            updatePlanNotes,
            goToMainMenu,
            getTopicsForMilestone,
            getMilestoneProgress,
            toggleMilestone,
            addTopic,
            addMilestone,
            deleteItem,
            openEditModal,
            saveEdit,
            toggleTopicCompletion,
            fetchSuggestions,
            addSelectedTopics,
            closeModals,
            setTheme,
            overallProgressSegments
        };
    }
});

app.component('progress-circle', {
    props: ['segments'],
    template: `
        <div class="progress-circle">
            <svg class="progress-ring" width="120" height="120">
                <circle class="progress-ring__circle-bg" stroke-width="8" fill="transparent" r="52" cx="60" cy="60"/>
                <g v-if="totalProgress > 0" transform="rotate(-90, 60, 60)">
                    <circle v-for="(segment, index) in segments"
                            class="progress-ring__circle"
                            stroke-width="8"
                            fill="transparent"
                            r="52"
                            cx="60"
                            cy="60"
                            :stroke="segment.color"
                            :stroke-dasharray="circumference"
                            :stroke-dashoffset="calculateOffset(index)"
                    />
                </g>
            </svg>
            <span class="progress-text">{{ totalProgress }}%</span>
        </div>
    `,
    data() {
        return {
            circumference: 2 * Math.PI * 52
        };
    },
    computed: {
        totalProgress() {
            if (!this.segments || this.segments.length === 0 || (this.segments.length === 1 && this.segments[0].color === '#e0e0e0')) {
                return 0;
            }
            return Math.round(this.segments.reduce((acc, segment) => acc + segment.percentage, 0));
        }
    },
    methods: {
        calculateOffset(index) {
            const percentageSoFar = this.segments.slice(0, index).reduce((acc, segment) => acc + segment.percentage, 0);
            const segmentPercentage = this.segments[index].percentage;
            const totalPercentage = 100;

            const dash = (segmentPercentage / totalPercentage) * this.circumference;
            const gap = this.circumference - dash;
            const offset = (percentageSoFar / totalPercentage) * this.circumference;

            return this.circumference - offset - dash;
        }
    }
});

app.mount('#app');
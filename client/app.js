
const { createApp, ref, onMounted, computed, nextTick } = Vue;

const app = createApp({
    template: `
        <div class="app-layout">
            <div v-if="loading">Loading...</div>
            <div v-if="!loading && !isAuthenticated">
                <div class="login-container">
                    <h1>{{ isRegistering ? 'Register for Career Study Plan' : 'Login to Career Study Plan' }}</h1>
                    <form @submit.prevent="isRegistering ? register() : login()">
                        <div class="form-group">
                             <label>Username:</label>
                             <input v-model="loginCredentials.username" required>
                        </div>
                        <div class="form-group">
                             <label>Password:</label>
                             <input v-model="loginCredentials.password" type="password" required>
                        </div>
                        <button type="submit">{{ isRegistering ? 'Register' : 'Login' }}</button>
                    </form>
                    <button @click="isRegistering = !isRegistering" class="toggle-mode-btn">
                        {{ isRegistering ? 'Already have an account? Login' : 'Need an account? Register' }}
                    </button>
                    <div v-if="loginError" class="error-message">{{ loginError }}</div>
                </div>
            </div>
            <div v-if="!loading && isAuthenticated && currentView === 'mainMenu'">
                <header class="app-header">
                    <h1>Select a Career Plan</h1>
                    <div class="header-controls">
                        <div class="user-profile" v-if="isAuthenticated">
                            <div class="profile-dropdown-container">
                                <button @click="toggleProfileDropdown" class="profile-button">
                                    <img :src="(currentUser && currentUser.profilePicture) || defaultProfilePicture.value" alt="User Profile" class="profile-picture" @error="handleImageError">
                                </button>
                                <div v-if="showProfileDropdown" class="profile-dropdown">
                                    <button @click="openSettings">Settings</button>
                                    <button @click="logout">Log Out</button>
                                </div>
                            </div>
                        </div>
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
                    <h1 v-if="!editingPlanName" @click="startEditingPlanName" class="plan-title">{{ selectedPlan.name }}</h1>
                    <input v-if="editingPlanName" type="text" v-model="planName" @blur="updatePlanName" @keyup.enter="updatePlanName" ref="planNameInput" class="plan-title-input">
                    <div class="header-controls">
                        <div class="user-profile" v-if="isAuthenticated">
                            <div class="profile-dropdown-container">
                                <button @click="toggleProfileDropdown" class="profile-button">
                                    <img :src="(currentUser && currentUser.profilePicture) || defaultProfilePicture.value" alt="User Profile" class="profile-picture" @error="handleImageError">
                                </button>
                                <div v-if="showProfileDropdown" class="profile-dropdown">
                                    <button @click="openSettings">Settings</button>
                                    <button @click="logout">Log Out</button>
                                </div>
                            </div>
                        </div>
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
                        <div class="upcoming-deadlines-section">
                            <h2>Topics</h2>
                            <div class="topics-tabs">
                                <button @click="setActiveTab('upcoming')" :class="{ active: activeTab === 'upcoming' }">Upcoming</button>
                                <button @click="setActiveTab('completed')" :class="{ active: activeTab === 'completed' }">Completed</button>
                            </div>
                            <div v-if="activeTab === 'upcoming'">
                                <ul v-if="upcomingDeadlines.length > 0" class="topics-list">
                                    <li v-for="item in upcomingDeadlines" :key="item.id" :style="{ borderLeft: '4px solid ' + item.color }" class="topic-item">
                                        <div class="topic-content">
                                            <strong>{{ item.name }}</strong> - {{ item.dueDate }}
                                            <br>
                                            <small>{{ item.plan }} / {{ item.milestone }}</small>
                                        </div>
                                        <button v-if="item.type === 'topic'" @click="markTopicCompleted(item.id)" class="checkmark-btn">✓</button>
                                    </li>
                                </ul>
                                <div v-else>
                                    <p>No upcoming topics.</p>
                                    <button @click="openAddTopicModal" class="add-topic-btn">Add New Topic</button>
                                </div>
                            </div>
                            <div v-if="activeTab === 'completed'">
                                <ul v-if="completedTopics.length > 0" class="topics-list">
                                    <li v-for="item in completedTopics" :key="item.id" :style="{ borderLeft: '4px solid ' + item.color }" class="topic-item completed">
                                        <div class="topic-content">
                                            <strong>{{ item.name }}</strong> - {{ item.dueDate }}
                                            <br>
                                            <small>{{ item.plan }} / {{ item.milestone }}</small>
                                        </div>
                                        <button v-if="item.type === 'topic'" @click="markTopicCompleted(item.id)" class="checkmark-btn">↺</button>
                                    </li>
                                </ul>
                                <div v-else>
                                    <p>No completed topics yet.</p>
                                </div>
                            </div>
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

                    <div v-if="showAddTopicModal" class="modal">
                        <div class="modal-content">
                            <span class="close-btn" @click="closeModals">&times;</span>
                            <h2>Add Topic</h2>
                            <div class="form-group">
                                <label>Text:</label>
                                <input v-model="newTopic.text">
                            </div>
                            <div class="form-group">
                                <label>Date:</label>
                                <input v-model="newTopic.date" type="date">
                            </div>
                            <div class="form-group">
                                <label>Color:</label>
                                <input v-model="newTopic.color" type="color">
                            </div>
                            <div class="form-group">
                                <label>Milestone:</label>
                                <select v-model="newTopic.milestoneId">
                                    <option value="">None</option>
                                    <option v-for="milestone in selectedPlan.milestones" :value="milestone.id">{{ milestone.text }}</option>
                                </select>
                            </div>
                            <button @click="addTopicFromModal">Add Topic</button>
                        </div>
                    </div>
        
                    <div v-if="showSettingsModal" class="modal">
                        <div class="modal-content">
                            <span class="close-btn" @click="closeModals">&times;</span>
                            <h2>Settings</h2>
                            <div class="form-group">
                                <label>Username:</label>
                                <input v-model="settingsData.username" :placeholder="currentUser.username">
                            </div>
                            <div class="form-group">
                                <label>New Password:</label>
                                <input v-model="settingsData.newPassword" type="password" placeholder="Enter new password">
                            </div>
                            <div class="form-group">
                                <label>Confirm New Password:</label>
                                <input v-model="settingsData.confirmPassword" type="password" placeholder="Confirm new password">
                            </div>
                            <div class="form-group">
                                <label>Theme:</label>
                                <select v-model="settingsData.theme">
                                    <option value="theme-light">Light</option>
                                    <option value="theme-dark">Dark</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Profile Picture:</label>
                                <div class="profile-picture-preview">
                                    <img :src="(currentUser && currentUser.profilePicture) || defaultProfilePicture.value" alt="Current Profile Picture" class="profile-picture-large" @error="handleImageError">
                                </div>
                                <input type="file" @change="handleProfilePictureChange" accept="image/*" class="file-input">
                                <button @click="resetProfilePicture" class="reset-btn">Reset to Default</button>
                            </div>
                            <button @click="saveSettings">Save Settings</button>
                            <button @click="deleteUser" class="delete-user-btn">Delete Account</button>
                            <div v-if="settingsError" class="error-message">{{ settingsError }}</div>
                        </div>
                    </div>
    `,
    setup() {
        const currentView = ref('mainMenu');
        const theme = ref('theme-light');
        const plans = ref([]);
        const selectedPlan = ref(null);
        const user = ref({ profilePicture: '' });
        const isAuthenticated = ref(false);
        const currentUser = ref(null);
        const loginCredentials = ref({ username: '', password: '' });
        const loginError = ref('');
        const showProfileDropdown = ref(false);
        const showSettingsModal = ref(false);
        const defaultProfilePicture = ref('../Assets/Default profile picture.jpg');
        const isRegistering = ref(false);
        const registeredUsers = ref(JSON.parse(localStorage.getItem('registeredUsers') || '[]'));
        const settingsData = ref({ username: '', newPassword: '', confirmPassword: '', theme: 'theme-light' });
        const settingsError = ref('');
        const newPlanName = ref('');
        const newTopic = ref({ text: '', date: '', color: '#f1c40f', milestoneId: '' });
        const newMilestone = ref({ text: '', date: '', color: '#9b59b6' });
        const showEditTopicModal = ref(false);
        const showAddTopicModal = ref(false);
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
        const activeTab = ref('upcoming');

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

        const authState = computed(() => ({
            isAuthenticated: isAuthenticated.value,
            currentUser: currentUser.value,
            isLoading: loading.value
        }));

        const upcomingDeadlines = computed(() => {
            if (!selectedPlan.value) return [];
            const deadlines = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(today.getDate() + 7);

            if (selectedPlan.value.milestones) {
                selectedPlan.value.milestones.forEach(m => {
                    const dueDate = new Date(m.date);
                    if (dueDate >= today && dueDate <= sevenDaysFromNow) {
                        deadlines.push({
                            id: `m-${m.id}`,
                            name: m.text,
                            dueDate: m.date,
                            plan: selectedPlan.value.name,
                            milestone: m.text,
                            type: 'milestone',
                            color: m.color
                        });
                    }
                });
            }

            if (selectedPlan.value.topics) {
                selectedPlan.value.topics.filter(t => !t.completed).forEach(t => {
                    const dueDate = new Date(t.date);
                    if (dueDate >= today && dueDate <= sevenDaysFromNow) {
                        const milestone = selectedPlan.value.milestones.find(m => m.id == t.milestoneId);
                        deadlines.push({
                            id: `t-${t.id}`,
                            name: t.text,
                            dueDate: t.date,
                            plan: selectedPlan.value.name,
                            milestone: milestone ? milestone.text : 'Unassigned',
                            type: 'topic',
                            color: t.color,
                            completed: t.completed,
                            milestoneId: t.milestoneId
                        });
                    }
                });
            }

            return deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        });

        const completedTopics = computed(() => {
            if (!selectedPlan.value) return [];
            const completed = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedPlan.value.topics) {
                selectedPlan.value.topics.filter(t => t.completed).forEach(t => {
                    const dueDate = new Date(t.date);
                    const milestone = selectedPlan.value.milestones.find(m => m.id == t.milestoneId);
                    completed.push({
                        id: `t-${t.id}`,
                        name: t.text,
                        dueDate: t.date,
                        plan: selectedPlan.value.name,
                        milestone: milestone ? milestone.text : 'Unassigned',
                        type: 'topic',
                        color: t.color,
                        completed: t.completed,
                        milestoneId: t.milestoneId
                    });
                });
            }

            return completed.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        });

        const fetchPlans = async () => {
            try {
                const timestamp = Date.now(); // Cache buster
                const res = await fetch(`http://localhost:3000/api/plans?t=${timestamp}`, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                const allPlans = await res.json();

                // Automatically claim any plans without userId for this user (one-time migration)
                const orphanPlans = allPlans.filter(plan => !plan.userId);
                if (orphanPlans.length > 0) {
                    console.log(`Found ${orphanPlans.length} orphan plans - assigning to current user`);
                    for (const plan of orphanPlans) {
                        try {
                            await fetch(`http://localhost:3000/api/plans/${plan.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: currentUser.value.username })
                            });
                        } catch (updateError) {
                            console.error('Error updating orphan plan:', updateError);
                        }
                    }
                }

                // Now filter to show only current user's plans
                plans.value = allPlans.filter(plan => plan.userId === currentUser.value.username);

                console.log(`Loaded ${plans.value.length} plans for user ${currentUser.value.username}`);
                console.log('All fetched plans:', allPlans);
                console.log('Filtered plans:', plans.value);
            } catch (error) {
                console.error('Error fetching plans:', error);
                plans.value = []; // Ensure we have an empty array on error
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
                    body: JSON.stringify({
                        name: newPlanName.value,
                        userId: currentUser.value.username,
                        lastEdited: new Date().toISOString()
                    })
                });
                const newPlan = await res.json();
                newPlanName.value = '';

                // Force fresh fetch to get updated data
                setTimeout(() => fetchPlans(), 100);
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
                body: JSON.stringify({
                    name: selectedPlan.value.name,
                    userId: currentUser.value.username,
                    lastEdited: new Date().toISOString()
                })
            });
            editingPlanName.value = false;
        };

        const updatePlanNotes = async () => {
            if (!selectedPlan.value) return;
            await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: selectedPlan.value.notes,
                    userId: currentUser.value.username,
                    lastEdited: new Date().toISOString()
                })
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
                    body: JSON.stringify({ ...topicData, userId: currentUser.value.username, lastEdited: new Date().toISOString() })
                });
                newTopic.value = { text: '', date: '', color: '#f1c40f', milestoneId: '' };
                const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
                selectedPlan.value = await res.json();
                initializeCalendar();
            }
        };

        const addMilestone = async () => {
            if (newMilestone.value.text && newMilestone.value.date) {
                await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...newMilestone.value, userId: currentUser.value.username, lastEdited: new Date().toISOString() })
                });
                newMilestone.value = { text: '', date: '', color: '#9b59b6' };
                const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
                selectedPlan.value = await res.json();
                initializeCalendar();
            }
        };

        const deleteItem = async (type, id) => {
            const url = type === 'topic'
                ? `http://localhost:3000/api/plans/${selectedPlan.value.id}/topics/${id}`
                : `http://localhost:3000/api/plans/${selectedPlan.value.id}/milestones/${id}`;
            await fetch(url, { method: 'DELETE' });
            const res = await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}`);
            selectedPlan.value = await res.json();
            initializeCalendar();
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
                  color: editingItem.value.color,
                  userId: currentUser.value.username
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
                        completed: false,
                        userId: currentUser.value.username
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
            showAddTopicModal.value = false;
            showSettingsModal.value = false;
            editingItem.value = {};
            suggestions.value = [];
            selectedSuggestions.value = [];
            currentMilestone.value = null;
        };

        const openAddTopicModal = () => {
            showAddTopicModal.value = true;
        };

        const addTopicFromModal = async () => {
            await addTopic();
            closeModals();
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
                events: events,
                eventDidMount: function (info) {
                    if (info.event.extendedProps.status === 'completed') {
                        info.el.style.opacity = '0.5';
                    }
                }
            });
            calendarInstance.render();
        };

        const setTheme = (newTheme) => {
            theme.value = newTheme;
            document.body.className = newTheme;
        };

        const register = async () => {
            if (loginCredentials.value.username && loginCredentials.value.password) {
                const usernameLower = loginCredentials.value.username.toLowerCase();

                // Check if user already exists (case insensitive)
                const existingUser = registeredUsers.value.find(u => u.username.toLowerCase() === usernameLower);
                if (existingUser) {
                    loginError.value = 'Username already exists';
                    return;
                }

                // Add new user (store in original case)
                const newUser = {
                    username: loginCredentials.value.username,
                    password: loginCredentials.value.password,
                    profilePicture: defaultProfilePicture.value
                };
                registeredUsers.value.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers.value));

                // Auto login after registration
                isAuthenticated.value = true;
                currentUser.value = {
                    username: newUser.username,
                    profilePicture: newUser.profilePicture
                };
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
                loginCredentials.value = { username: '', password: '' };
                loginError.value = '';
                isRegistering.value = false;
                fetchPlans();
            } else {
                loginError.value = 'Please enter both username and password';
            }
        };

        const login = async () => {
            // Check against registered users (case insensitive)
            if (loginCredentials.value.username && loginCredentials.value.password) {
                const usernameLower = loginCredentials.value.username.toLowerCase();

                const user = registeredUsers.value.find(u =>
                    u.username.toLowerCase() === usernameLower && u.password === loginCredentials.value.password
                );

                if (user) {
                    isAuthenticated.value = true;
                    // Ensure user has all required properties
                    currentUser.value = {
                        username: user.username,
                        profilePicture: user.profilePicture || defaultProfilePicture.value
                    };
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
                    loginCredentials.value = { username: '', password: '' };
                    loginError.value = '';
                    fetchPlans();
                } else {
                    loginError.value = 'Invalid username or password';
                }
            } else {
                loginError.value = 'Please enter both username and password';
            }
        };

        const logout = () => {
            isAuthenticated.value = false;
            currentUser.value = null;
            // Clear all authentication data
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionToken');
            currentView.value = 'mainMenu';
            selectedPlan.value = null;
            plans.value = [];
        };

        const toggleProfileDropdown = () => {
            showProfileDropdown.value = !showProfileDropdown.value;
        };

        const closeProfileDropdown = () => {
            showProfileDropdown.value = false;
        };

        const deleteUser = () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone and will remove all your data.')) {
                // Remove user from registeredUsers
                const userIndex = registeredUsers.value.findIndex(u => u.username === currentUser.value.username);
                if (userIndex !== -1) {
                    registeredUsers.value.splice(userIndex, 1);
                    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers.value));
                }

                // Clear authentication
                isAuthenticated.value = false;
                currentUser.value = null;
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('currentUser');

                // Reset app state
                plans.value = [];
                selectedPlan.value = null;
                showProfileDropdown.value = false;

                alert('Your account has been deleted successfully.');
            }
        };

        const openSettings = () => {
            showProfileDropdown.value = false;
            showSettingsModal.value = true;
        };

        const makeAuthenticatedRequest = async (url, options = {}) => {
            if (!isAuthenticated.value) {
                throw new Error('User not authenticated');
            }

            // In a real app, you would add auth headers here
            // For now, we'll just check authentication status
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth token here if available
                    // 'Authorization': `Bearer ${authToken.value}`
                },
                ...options
            };

            return fetch(url, defaultOptions);
        };

        const handleImageError = (event) => {
            // Fallback to default picture if current picture fails to load
            event.target.src = defaultProfilePicture.value;
        };

        const handleProfilePictureChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (currentUser.value) {
                        currentUser.value.profilePicture = e.target.result;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        const resetProfilePicture = () => {
            if (currentUser.value) {
                currentUser.value.profilePicture = defaultProfilePicture.value;
                localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
            }
        };

        const setActiveTab = (tab) => {
            activeTab.value = tab;
        };

        const markTopicCompleted = async (topicId) => {
            const actualTopicId = topicId.replace('t-', '');
            const topicToUpdate = selectedPlan.value.topics.find(t => t.id == actualTopicId);
            if (topicToUpdate) {
                topicToUpdate.completed = !topicToUpdate.completed;
                await fetch(`http://localhost:3000/api/plans/${selectedPlan.value.id}/topics/${actualTopicId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...topicToUpdate, userId: currentUser.value.username, lastEdited: new Date().toISOString() })
                });
                // Update the calendar to reflect the changes
                initializeCalendar();
            }
        };

        const saveSettings = () => {
            settingsError.value = '';

            // Validate passwords match if provided
            if (settingsData.value.newPassword && settingsData.value.newPassword !== settingsData.value.confirmPassword) {
                settingsError.value = 'Passwords do not match';
                return;
            }

            // Update username if provided
            if (settingsData.value.username && settingsData.value.username !== currentUser.value.username) {
                // Check if username already exists
                const existingUser = registeredUsers.value.find(u => u.username === settingsData.value.username && u.username !== currentUser.value.username);
                if (existingUser) {
                    settingsError.value = 'Username already exists';
                    return;
                }

                // Update in registered users
                const userIndex = registeredUsers.value.findIndex(u => u.username === currentUser.value.username);
                if (userIndex !== -1) {
                    registeredUsers.value[userIndex].username = settingsData.value.username;
                }

                currentUser.value.username = settingsData.value.username;
            }

            // Update password if provided
            if (settingsData.value.newPassword) {
                const userIndex = registeredUsers.value.findIndex(u => u.username === currentUser.value.username);
                if (userIndex !== -1) {
                    registeredUsers.value[userIndex].password = settingsData.value.newPassword;
                }
            }

            // Update theme
            setTheme(settingsData.value.theme);

            // Save changes
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers.value));
            localStorage.setItem('currentUser', JSON.stringify(currentUser.value));

            // Reset form
            settingsData.value = { username: '', newPassword: '', confirmPassword: '', theme: settingsData.value.theme };
            closeModals();
        };

        const checkAuthStatus = () => {
            // Check server session token to detect server restart
            fetch('http://localhost:3000/api/session')
                .then(response => response.json())
                .then(data => {
                    const storedSessionToken = localStorage.getItem('sessionToken');
                    const currentSessionToken = data.sessionToken;

                    // If session tokens don't match, server restarted - force logout
                    if (storedSessionToken && storedSessionToken !== currentSessionToken) {
                        console.log('Server restarted, forcing logout');
                        logout();
                        return;
                    }

                    // Store the current session token
                    localStorage.setItem('sessionToken', currentSessionToken);

                    // Proceed with normal auth check
                    const authStatus = localStorage.getItem('isAuthenticated');
                    if (authStatus === 'true') {
                        isAuthenticated.value = true;
                        const userData = localStorage.getItem('currentUser');
                        if (userData) {
                            currentUser.value = JSON.parse(userData);
                            fetchPlans();
                        } else {
                            loading.value = false;
                        }
                    } else {
                        loading.value = false;
                    }
                })
                .catch(error => {
                    console.error('Cannot connect to server:', error);
                    // If server is down, force logout
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('currentUser');
                    isAuthenticated.value = false;
                    loading.value = false;
                });
        };

        onMounted(() => {
            console.log('App starting...');
            checkAuthStatus();
            setTheme(theme.value);

            // Add click outside listener for profile dropdown
            document.addEventListener('click', (event) => {
                const profileContainer = document.querySelector('.profile-dropdown-container');
                if (profileContainer && !profileContainer.contains(event.target)) {
                    closeProfileDropdown();
                }
            });
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
            overallProgressSegments,
            upcomingDeadlines,
            user,
            showAddTopicModal,
            openAddTopicModal,
            addTopicFromModal,
            isAuthenticated,
            currentUser,
            loginCredentials,
            loginError,
            login,
            logout,
            showProfileDropdown,
            toggleProfileDropdown,
            openSettings,
            authState,
            makeAuthenticatedRequest,
            showSettingsModal,
            handleProfilePictureChange,
            resetProfilePicture,
            handleImageError,
            defaultProfilePicture,
            isRegistering,
            register,
            registeredUsers,
            settingsData,
            settingsError,
            saveSettings,
            activeTab,
            setActiveTab,
            markTopicCompleted,
            completedTopics,
            closeProfileDropdown,
            deleteUser
        };
    }
});

app.component('progress-circle', {
    props: ['segments'],
    template: `
        <div class="progress-circle">
            <svg class="progress-ring" width="120" height="120">
                <circle class="progress-ring__circle-bg" stroke-width="8" fill="transparent" r="52" cx="60" cy="60"/>
                <g v-if="totalProgress > 0">
                    <path v-for="(segment, index) in visibleSegments"
                          :d="getSegmentPath(segment, index)"
                          :stroke="segment.color"
                          stroke-width="8"
                          fill="transparent"
                          stroke-linecap="round"/>
                </g>
            </svg>
            <span class="progress-text">{{ totalProgress }}%</span>
        </div>
    `,
    data() {
        return {
            radius: 52,
            circumference: 2 * Math.PI * 52
        };
    },
    computed: {
        totalProgress() {
            if (!this.segments || this.segments.length === 0 || (this.segments.length === 1 && this.segments[0].color === '#e0e0e0')) {
                return 0;
            }
            return Math.round(this.segments.reduce((acc, segment) => acc + segment.percentage, 0));
        },
        visibleSegments() {
            return this.segments.filter(segment => segment.color !== '#e0e0e0' && segment.percentage > 0);
        }
    },
    methods: {
        getSegmentPath(segment, index) {
            const startAngle = this.getStartAngle(index);
            const endAngle = startAngle + (segment.percentage / 100) * 360;

            const startX = 60 + this.radius * Math.cos((startAngle * Math.PI) / 180);
            const startY = 60 + this.radius * Math.sin((startAngle * Math.PI) / 180);
            const endX = 60 + this.radius * Math.cos((endAngle * Math.PI) / 180);
            const endY = 60 + this.radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = segment.percentage > 50 ? 1 : 0;

            return `M ${startX} ${startY} A ${this.radius} ${this.radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        },
        getStartAngle(index) {
            let startAngle = -90; // Start from top
            for (let i = 0; i < index; i++) {
                startAngle += (this.visibleSegments[i].percentage / 100) * 360;
            }
            return startAngle;
        }
    }
});

app.mount('#app');
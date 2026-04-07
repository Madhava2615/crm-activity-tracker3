const tabSignup = document.getElementById('tabSignup');
const tabLogin = document.getElementById('tabLogin');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const authCard = document.getElementById('authCard');
const app = document.getElementById('app');
const appMessage = document.getElementById('appMessage');

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = 'message ' + type;
    authMessage.style.display = 'block';
}

function clearMessage() {
    authMessage.style.display = 'none';
}

function showAppMessage(text, type) {
    appMessage.textContent = text;
    appMessage.className = 'message app-message ' + type;
    appMessage.style.display = 'block';

    setTimeout(() => {
        appMessage.style.display = 'none';
    }, 2000);
}

function switchToSignup() {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    clearMessage();
}

function switchToLogin() {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    clearMessage();
}

tabSignup.onclick = switchToSignup;
tabLogin.onclick = switchToLogin;

function getUsers() {
    return JSON.parse(localStorage.getItem('crm_users') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('crm_users', JSON.stringify(users));
}

function normalizeUsername(username) {
    return username.trim().toLowerCase();
}

signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessage();

    const username = normalizeUsername(document.getElementById('suUsername').value);
    const password = document.getElementById('suPassword').value.trim();
    const confirm = document.getElementById('suConfirm').value.trim();

    if (!username || !password) {
        showMessage('Username and password are required.', 'error');
        return;
    }

    if (password !== confirm) {
        showMessage('Passwords do not match.', 'error');
        return;
    }

    const users = getUsers();

    if (users[username]) {
        showMessage('Username already exists. Please login.', 'error');
        switchToLogin();
        return;
    }

    users[username] = {
        username: username,
        password: password
    };

    saveUsers(users);
    showMessage('Account created successfully. You can now login.', 'success');
    signupForm.reset();

    setTimeout(() => {
        switchToLogin();
        document.getElementById('liUsername').value = username;
    }, 500);
});

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessage();

    const username = normalizeUsername(document.getElementById('liUsername').value);
    const password = document.getElementById('liPassword').value.trim();

    const users = getUsers();

    if (!users[username]) {
        showMessage('Username not found. Please create account first.', 'error');
        return;
    }

    if (users[username].password !== password) {
        showMessage('Invalid password.', 'error');
        return;
    }

    localStorage.setItem('crm_current_user', username);
    authCard.style.display = 'none';
    app.style.display = 'block';
    initTracker(username);
});

window.addEventListener('load', function () {
    const currentUser = localStorage.getItem('crm_current_user');
    if (currentUser) {
        authCard.style.display = 'none';
        app.style.display = 'block';
        initTracker(currentUser);
    }
});

function logout() {
    const ok = confirm('Are you sure you want to logout?');
    if (!ok) return;

    localStorage.removeItem('crm_current_user');
    location.reload();
}

class ActivityTracker {
    constructor(username) {
        this.username = username;
        this.storageKey = 'crm_activities_' + username;
        this.activities = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        this.editingId = null;
        this.init();
    }

    init() {
        document.getElementById('currentUser').textContent = this.username;

        document.getElementById('activityForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingId) {
                this.updateActivity();
            } else {
                this.addActivity();
            }
        });

        document.getElementById('searchInput').addEventListener('input', () => this.render());
        document.getElementById('statusFilter').addEventListener('change', () => this.render());
        document.getElementById('typeFilter').addEventListener('change', () => this.render());
        document.getElementById('dateFilter').addEventListener('change', () => this.render());
        document.getElementById('sortFilter').addEventListener('change', () => this.render());

        this.setDefaultDate();
        this.render();
    }

    setDefaultDate() {
        document.getElementById('activityDate').valueAsNumber =
            Date.now() - (new Date()).getTimezoneOffset() * 60000;
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.activities));
    }

    getFormData() {
        return {
            type: document.getElementById('activityType').value,
            contactName: document.getElementById('contactName').value.trim(),
            date: document.getElementById('activityDate').value,
            duration: parseInt(document.getElementById('duration').value) || 0,
            notes: document.getElementById('notes').value.trim()
        };
    }

    validateForm(data) {
        if (!data.type) {
            alert('Please select activity type');
            return false;
        }
        if (!data.contactName) {
            alert('Please enter contact name');
            return false;
        }
        if (!data.date) {
            alert('Please select date and time');
            return false;
        }
        return true;
    }

    addActivity() {
        const data = this.getFormData();
        if (!this.validateForm(data)) return;

        const activity = {
            id: Date.now(),
            type: data.type,
            contactName: data.contactName,
            date: data.date,
            duration: data.duration,
            notes: data.notes,
            closed: false,
            closedDate: null
        };

        this.activities.unshift(activity);
        this.save();
        this.clearForm();
        this.render();
        showAppMessage('Activity added successfully', 'success');
    }

    editActivity(id) {
        const act = this.activities.find(a => a.id === id);
        if (!act) return;

        document.getElementById('activityType').value = act.type;
        document.getElementById('contactName').value = act.contactName;
        document.getElementById('activityDate').value = act.date;
        document.getElementById('duration').value = act.duration || '';
        document.getElementById('notes').value = act.notes || '';

        this.editingId = id;
        document.getElementById('submitBtn').textContent = 'Update Activity';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateActivity() {
        const data = this.getFormData();
        if (!this.validateForm(data)) return;

        const act = this.activities.find(a => a.id === this.editingId);
        if (!act) return;

        act.type = data.type;
        act.contactName = data.contactName;
        act.date = data.date;
        act.duration = data.duration;
        act.notes = data.notes;

        this.save();
        this.clearForm();
        this.render();
        showAppMessage('Activity updated successfully', 'success');
    }

    clearForm() {
        document.getElementById('activityForm').reset();
        this.editingId = null;
        document.getElementById('submitBtn').textContent = 'Add Activity';
        this.setDefaultDate();
    }

    toggleClose(id) {
        const act = this.activities.find(a => a.id === id);
        if (!act) return;

        act.closed = !act.closed;
        act.closedDate = act.closed ? new Date().toISOString() : null;

        this.save();
        this.render();
        showAppMessage(act.closed ? 'Activity closed' : 'Activity reopened', 'success');
    }

    deleteActivity(id) {
        const ok = confirm('Are you sure you want to delete this activity?');
        if (!ok) return;

        this.activities = this.activities.filter(a => a.id !== id);

        if (this.editingId === id) {
            this.clearForm();
        }

        this.save();
        this.render();
        showAppMessage('Activity deleted successfully', 'success');
    }

    clearAllActivities() {
        if (this.activities.length === 0) {
            alert('No activities to clear');
            return;
        }

        const ok = confirm('Are you sure you want to delete all activities?');
        if (!ok) return;

        this.activities = [];
        this.save();
        this.clearForm();
        this.render();
        showAppMessage('All activities cleared', 'success');
    }

    getStats() {
        const total = this.activities.length;
        const open = this.activities.filter(a => !a.closed).length;
        const closed = total - open;
        const calls = this.activities.filter(a => a.type === 'call').length;
        const meetings = this.activities.filter(a => a.type === 'meeting').length;
        const emails = this.activities.filter(a => a.type === 'email').length;

        return { total, open, closed, calls, meetings, emails };
    }

    formatType(type) {
        return {
            call: 'Call',
            meeting: 'Meeting',
            email: 'Email',
            followup: 'Follow-up',
            demo: 'Demo',
            task: 'Task'
        }[type] || type;
    }

    formatDate(str) {
        if (!str) return '';
        return new Date(str).toLocaleString();
    }

    formatNotes(notes) {
        if (!notes) return '<em>No notes</em>';
        return notes.replace(/\n/g, '<br>');
    }

    isToday(dateStr) {
        const d = new Date(dateStr);
        const today = new Date();

        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    }

    isThisWeek(dateStr) {
        const d = new Date(dateStr);
        const today = new Date();
        const diffTime = d - today;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        return diffDays >= -6 && diffDays <= 6;
    }

    getFilteredActivities() {
        const searchValue = document.getElementById('searchInput').value.toLowerCase();
        const statusValue = document.getElementById('statusFilter').value;
        const typeValue = document.getElementById('typeFilter').value;
        const dateValue = document.getElementById('dateFilter').value;
        const sortValue = document.getElementById('sortFilter').value;

        let filtered = this.activities.filter(activity => {
            const matchesSearch =
                activity.contactName.toLowerCase().includes(searchValue) ||
                (activity.notes && activity.notes.toLowerCase().includes(searchValue));

            const matchesStatus =
                statusValue === 'all' ||
                (statusValue === 'open' && !activity.closed) ||
                (statusValue === 'closed' && activity.closed);

            const matchesType =
                typeValue === 'all' || activity.type === typeValue;

            const matchesDate =
                dateValue === 'all' ||
                (dateValue === 'today' && this.isToday(activity.date)) ||
                (dateValue === 'week' && this.isThisWeek(activity.date));

            return matchesSearch && matchesStatus && matchesType && matchesDate;
        });

        if (sortValue === 'latest') {
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortValue === 'oldest') {
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortValue === 'name') {
            filtered.sort((a, b) => a.contactName.localeCompare(b.contactName));
        }

        return filtered;
    }

    getEmptyMessage() {
        const searchValue = document.getElementById('searchInput').value.trim();
        const statusValue = document.getElementById('statusFilter').value;
        const typeValue = document.getElementById('typeFilter').value;
        const dateValue = document.getElementById('dateFilter').value;

        if (this.activities.length === 0) {
            return 'No activities added yet. Add your first activity.';
        }

        if (searchValue || statusValue !== 'all' || typeValue !== 'all' || dateValue !== 'all') {
            return 'No matching activities found.';
        }

        return 'No activities available.';
    }

    render() {
        const stats = this.getStats();
        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('openCount').textContent = stats.open;
        document.getElementById('closedCount').textContent = stats.closed;
        document.getElementById('callCount').textContent = stats.calls;
        document.getElementById('meetingCount').textContent = stats.meetings;
        document.getElementById('emailCount').textContent = stats.emails;

        const list = document.getElementById('activitiesList');
        const filteredActivities = this.getFilteredActivities();

        if (filteredActivities.length === 0) {
            list.innerHTML = `<li class="empty-state">${this.getEmptyMessage()}</li>`;
            return;
        }

        list.innerHTML = filteredActivities.map(a => `
            <li class="activity-item ${a.closed ? 'closed' : ''}">
                <div class="activity-header">
                    <div>
                        <span class="activity-type ${a.type}">${this.formatType(a.type)}</span>
                        &nbsp;<strong>${a.contactName}</strong>
                    </div>
                    <div style="text-align:right;font-size:0.8rem;">
                        <div>${this.formatDate(a.date)}</div>
                        ${a.duration ? `<div>${a.duration} mins</div>` : ''}
                    </div>
                </div>

                <div>${this.formatNotes(a.notes)}</div>

                <div class="status-badge ${a.closed ? 'status-closed' : 'status-open'}">
                    ${a.closed ? 'Closed' : 'Open'}
                </div>

                ${a.closed && a.closedDate ? `
                    <div style="margin-top:4px;color:#28a745;font-size:0.8rem;">
                        Closed on ${this.formatDate(a.closedDate)}
                    </div>
                ` : ''}

                <div class="activity-actions">
                    <button class="btn-small btn-close" onclick="tracker.toggleClose(${a.id})">
                        ${a.closed ? 'Reopen' : 'Close'}
                    </button>
                    <button class="btn-small btn-edit" onclick="tracker.editActivity(${a.id})">
                        Edit
                    </button>
                    <button class="btn-small btn-delete" onclick="tracker.deleteActivity(${a.id})">
                        Delete
                    </button>
                </div>
            </li>
        `).join('');
    }
}

let tracker = null;

function initTracker(username) {
    tracker = new ActivityTracker(username);
}
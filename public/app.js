document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const apiUrlInput = document.getElementById('apiUrl');
  const routePathInput = document.getElementById('routePath');
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  
  const apiStatusBadge = document.getElementById('apiStatusBadge');
  const latencyDisplay = document.getElementById('latencyDisplay');
  const httpStatusDisplay = document.getElementById('httpStatusDisplay');
  const alertBanner = document.getElementById('alertBanner');
  
  const todoForm = document.getElementById('todoForm');
  const taskInput = document.getElementById('taskInput');
  const charCounter = document.getElementById('charCounter');
  const taskList = document.getElementById('taskList');
  const refreshBtn = document.getElementById('refreshBtn');
  
  const countAll = document.getElementById('countAll');
  const countPending = document.getElementById('countPending');
  const countCompleted = document.getElementById('countCompleted');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // State
  let tasks = [];
  let currentFilter = 'all';

  // Toggle Settings Panel
  toggleSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveConfigBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
    fetchTasks();
  });

  // Input Character Counter
  taskInput.addEventListener('input', (e) => {
    charCounter.textContent = `${e.target.value.length}/120`;
  });

  // Get API Endpoint URL
  const getEndpoint = () => {
    const base = apiUrlInput.value.replace(/\/$/, '');
    const path = routePathInput.value.replace(/^\//, '');
    return `${base}/${path}`;
  };

  // Status & Metrics Updater
  const updateMetrics = (status, latency, code) => {
    // Badge status
    apiStatusBadge.className = 'badge';
    if (status === 'loading') {
      apiStatusBadge.classList.add('status-loading');
      apiStatusBadge.textContent = 'Po ngarkohet...';
    } else if (status === 'success') {
      apiStatusBadge.classList.add('status-success');
      apiStatusBadge.textContent = 'Gati';
    } else {
      apiStatusBadge.classList.add('status-error');
      apiStatusBadge.textContent = 'Gabim API';
    }

    // Latency & Code
    latencyDisplay.textContent = latency ? `${latency} ms` : '-- ms';
    httpStatusDisplay.textContent = code || '---';

    // Handle 429 Rate Limit Alert
    if (code === 429) {
      alertBanner.className = 'alert-banner alert-429';
      alertBanner.textContent = '⚠️ Gabim 429: Shumë kërkesa rresht! Rate limiter-i yt në backend e bllokoi këtë kërkesë.';
    } else if (code >= 400) {
      alertBanner.className = 'alert-banner alert-429';
      alertBanner.textContent = `⚠️ Gabim nga serveri (HTTP ${code}). Kontrollo backend-in!`;
    } else {
      alertBanner.className = 'alert-banner hidden';
    }
  };

  // API Call Wrapper
  const apiCall = async (url, options = {}) => {
    const startTime = performance.now();
    updateMetrics('loading', null, null);

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      const data = response.ok ? await response.json() : null;
      updateMetrics(response.ok ? 'success' : 'error', latency, response.status);
      return { ok: response.ok, status: response.status, data };
    } catch (err) {
      const endTime = performance.now();
      updateMetrics('error', Math.round(endTime - startTime), 0);
      return { ok: false, status: 0, data: null };
    }
  };

  // Fetch Tasks (GET /api/tasks)
  const fetchTasks = async () => {
    const res = await apiCall(getEndpoint());
    if (res.ok && Array.isArray(res.data)) {
      tasks = res.data;
      renderTasks();
    }
  };

  // Add Task (POST /api/tasks)
  todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    const res = await apiCall(getEndpoint(), {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    if (res.ok) {
      taskInput.value = '';
      charCounter.textContent = '0/120';
      fetchTasks();
    }
  });

  // Toggle Task Status (PUT /api/tasks/:id)
  window.toggleTask = async (id, currentStatus) => {
    const res = await apiCall(`${getEndpoint()}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !currentStatus })
    });

    if (res.ok) fetchTasks();
  };

  // Delete Task (DELETE /api/tasks/:id)
  window.deleteTask = async (id) => {
    const res = await apiCall(`${getEndpoint()}/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) fetchTasks();
  };

  // Render Tasks to DOM
  const renderTasks = () => {
    // Update Counts
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.length - completedCount;
    
    countAll.textContent = tasks.length;
    countPending.textContent = pendingCount;
    countCompleted.textContent = completedCount;

    // Filter Tasks
    const filtered = tasks.filter(t => {
      if (currentFilter === 'pending') return !t.completed;
      if (currentFilter === 'completed') return t.completed;
      return true;
    });

    if (filtered.length === 0) {
      taskList.innerHTML = `
        <li class="empty-state">
          <p>Nuk ka detyra në këtë kategori.</p>
        </li>`;
      return;
    }

    taskList.innerHTML = filtered.map(task => `
      <li class="task-item ${task.completed ? 'completed' : ''}">
        <div class="task-content">
          <input 
            type="checkbox" 
            class="checkbox-custom" 
            ${task.completed ? 'checked' : ''} 
            onChange="toggleTask(${task.id}, ${task.completed})"
          >
          <span class="task-title">${escapeHtml(task.title)}</span>
        </div>
        <button class="delete-btn" onclick="deleteTask(${task.id})" title="Fshi detyrën">🗑️</button>
      </li>
    `).join('');
  };

  // Filter Buttons Event Listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  refreshBtn.addEventListener('click', fetchTasks);

  // Helper function to prevent XSS
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[match]));
  }

  // Initial Load
  fetchTasks();
});
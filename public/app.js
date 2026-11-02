document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
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

  let tasks = [];
  let currentFilter = 'all';
  toggleSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveConfigBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
    fetchTasks();
  });

  taskInput.addEventListener('input', (e) => {
    charCounter.textContent = `${e.target.value.length}/120`;
  });
  const getBaseUrl = () => {
    return apiUrlInput.value.replace(/\/$/, '');
  };

  const updateMetrics = (status, latency, code) => {
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

    latencyDisplay.textContent = latency ? `${latency} ms` : '-- ms';
    httpStatusDisplay.textContent = code || '---';

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

  const fetchTasks = async () => {
    const url = `${getBaseUrl()}/tasks/display`;
    const res = await apiCall(url);
    if (res.ok && Array.isArray(res.data)) {
      tasks = res.data;
      renderTasks();
    }
  };

  todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    const url = `${getBaseUrl()}/tasks/create`;
    const res = await apiCall(url, {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    if (res.ok) {
      taskInput.value = '';
      charCounter.textContent = '0/120';
      fetchTasks();
    }
  });

  window.toggleTask = async (id, currentStatus) => {
    const url = `${getBaseUrl()}/tasks/update/${id}`;
    const res = await apiCall(url, {
      method: 'PUT',
      body: JSON.stringify({ completed: !currentStatus })
    });

    if (res.ok) fetchTasks();
  };

  window.deleteTask = async (id) => {
    const url = `${getBaseUrl()}/tasks/delete/${id}`;
    const res = await apiCall(url, {
      method: 'DELETE'
    });

    if (res.ok) fetchTasks();
  };

  const renderTasks = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.length - completedCount;
    
    countAll.textContent = tasks.length;
    countPending.textContent = pendingCount;
    countCompleted.textContent = completedCount;

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

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  refreshBtn.addEventListener('click', fetchTasks);
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[match]));
  }
  fetchTasks();
});
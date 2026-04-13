class GroundTraceDashboard {
    constructor() {
        this.executeBtn = document.getElementById('executeBtn');
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusDot = this.statusIndicator.querySelector('.status-dot');
        this.statusText = document.getElementById('statusText');
        
        this.agentOutputs = {
            agent1: document.getElementById('agent1Output'),
            agent2: document.getElementById('agent2Output'),
            agent3: document.getElementById('agent3Output')
        };
        
        this.agentBadges = {
            agent1: document.getElementById('agent1Badge'),
            agent2: document.getElementById('agent2Badge'),
            agent3: document.getElementById('agent3Badge')
        };
        
        this.progressItems = {
            telemetry: document.getElementById('progressTelemetry'),
            agent1: document.getElementById('progressAgent1'),
            agent2: document.getElementById('progressAgent2'),
            agent3: document.getElementById('progressAgent3')
        };
        
        this.progressStatuses = {
            telemetry: document.getElementById('telemetryStatus'),
            agent1: document.getElementById('agent1Status'),
            agent2: document.getElementById('agent2Status'),
            agent3: document.getElementById('agent3Status')
        };
        
        this.agentPanels = {
            agent1: document.getElementById('agent1Panel'),
            agent2: document.getElementById('agent2Panel'),
            agent3: document.getElementById('agent3Panel')
        };
        
        this.currentView = 'all';
        this.isRunning = false;
        this.eventSource = null;
        
        this.init();
    }
    
    init() {
        this.executeBtn.addEventListener('click', () => this.executeAnalysis());
        this.downloadPdfBtn.addEventListener('click', () => this.downloadPdf());
        
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });
        
        this.checkStatus();
    }
    
    async checkStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            if (data.has_report) {
                await this.loadReport();
            }
        } catch (error) {
            console.error('Failed to check status:', error);
        }
    }
    
    async executeAnalysis() {
        if (this.isRunning) return;
        
        this.resetUI();
        this.setRunning(true);
        
        try {
            const response = await fetch('/api/execute', { method: 'POST' });
            const data = await response.json();
            
            if (data.error) {
                this.showToast(data.error, 'error');
                this.setRunning(false);
                return;
            }
            
            this.startStreaming();
        } catch (error) {
            this.showToast('Failed to start analysis: ' + error.message, 'error');
            this.setRunning(false);
        }
    }
    
    startStreaming() {
        this.eventSource = new EventSource('/api/stream');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleStreamEvent(data);
        };
        
        this.eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            this.eventSource.close();
        };
    }
    
    handleStreamEvent(data) {
        switch (data.type) {
            case 'status':
                this.handleStatus(data);
                break;
            case 'agent':
                this.handleAgentOutput(data);
                break;
            case 'complete':
                this.handleComplete();
                break;
            case 'error':
                this.handleError(data.message);
                break;
            case 'heartbeat':
                break;
        }
    }
    
    handleStatus(data) {
        const message = data.message;
        
        if (message.includes('Initializing') || message.includes('collecting')) {
            this.updateProgress('telemetry', 'running', 'Collecting...');
            this.addContentToAgent('agent1', '<div class="streaming-indicator"><div class="streaming-dots"><span></span><span></span><span></span></div> Collecting telemetry...</div>');
        } else if (message.includes('collected')) {
            this.updateProgress('telemetry', 'complete', 'Done');
            this.setSystemStatus('ready', 'Processing...');
            this.loadTelemetryInfo();
        } else if (message.includes('Agent 1')) {
            this.updateProgress('agent1', 'running', 'Analyzing...');
            this.updateAgentBadge('agent1', 'running', 'Running');
        } else if (message.includes('Agent 2')) {
            this.updateProgress('agent1', 'complete', 'Done');
            this.updateProgress('agent2', 'running', 'Analyzing...');
            this.updateAgentBadge('agent1', 'complete', 'Complete');
            this.updateAgentBadge('agent2', 'running', 'Running');
        } else if (message.includes('Agent 3')) {
            this.updateProgress('agent2', 'complete', 'Done');
            this.updateProgress('agent3', 'running', 'Generating...');
            this.updateAgentBadge('agent2', 'complete', 'Complete');
            this.updateAgentBadge('agent3', 'running', 'Running');
        }
    }
    
    handleAgentOutput(data) {
        const content = data.content || '';
        
        if (data.agent === 'agent1') {
            this.appendToAgent('agent1', content);
        } else if (data.agent === 'agent2') {
            this.appendToAgent('agent2', content);
        } else if (data.agent === 'agent3') {
            this.appendToAgent('agent3', content);
        }
    }
    
    handleComplete() {
        this.eventSource.close();
        this.setRunning(false);
        this.setSystemStatus('complete', 'Complete');
        this.updateProgress('agent3', 'complete', 'Done');
        this.updateAgentBadge('agent3', 'complete', 'Complete');
        this.downloadPdfBtn.disabled = false;
        this.showToast('Analysis complete!', 'success');
    }
    
    handleError(message) {
        this.eventSource.close();
        this.setRunning(false);
        this.setSystemStatus('error', 'Error');
        this.showToast('Error: ' + message, 'error');
    }
    
    resetUI() {
        Object.keys(this.agentOutputs).forEach(key => {
            this.agentOutputs[key].innerHTML = '<div class="placeholder-message"><div class="placeholder-icon">⏳</div><p>Waiting...</p></div>';
        });
        
        Object.keys(this.agentBadges).forEach(key => {
            this.updateAgentBadge(key, 'pending', 'Pending');
        });
        
        Object.keys(this.progressItems).forEach(key => {
            this.progressItems[key].classList.remove('active', 'complete', 'error');
            this.progressStatuses[key].textContent = 'Pending';
        });
        
        this.downloadPdfBtn.disabled = true;
        
        document.getElementById('hostInfo').textContent = '-';
        document.getElementById('osInfo').textContent = '-';
        document.getElementById('cpuInfo').textContent = '-';
        document.getElementById('memInfo').textContent = '-';
        document.getElementById('procCount').textContent = '-';
        document.getElementById('connCount').textContent = '-';
    }
    
    setRunning(running) {
        this.isRunning = running;
        this.executeBtn.disabled = running;
        
        if (running) {
            this.statusDot.className = 'status-dot running';
            this.statusText.textContent = 'Running';
        }
    }
    
    setSystemStatus(status, text) {
        this.statusDot.className = 'status-dot ' + status;
        this.statusText.textContent = text;
    }
    
    updateProgress(key, status, text) {
        this.progressItems[key].classList.remove('active', 'complete', 'error');
        this.progressItems[key].classList.add(status);
        this.progressStatuses[key].textContent = text;
    }
    
    updateAgentBadge(key, status, text) {
        this.agentBadges[key].className = 'panel-status ' + status;
        this.agentBadges[key].textContent = text;
    }
    
    getOutputContainer(key) {
        let container = this.agentOutputs[key].querySelector('.output-content');
        if (!container) {
            this.agentOutputs[key].innerHTML = '<div class="output-content"></div>';
            container = this.agentOutputs[key].querySelector('.output-content');
        }
        return container;
    }
    
    addContentToAgent(key, content) {
        const container = this.getOutputContainer(key);
        container.innerHTML = content;
        this.scrollToBottom(key);
    }
    
    appendToAgent(key, content) {
        const container = this.getOutputContainer(key);
        container.innerHTML += content;
        this.scrollToBottom(key);
    }
    
    scrollToBottom(key) {
        const output = this.agentOutputs[key];
        output.scrollTop = output.scrollHeight;
    }
    
    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        Object.keys(this.agentPanels).forEach(key => {
            this.agentPanels[key].style.display = view === 'all' || view === key ? 'block' : 'none';
        });
    }
    
    async loadReport() {
        try {
            const response = await fetch('/api/report');
            const data = await response.json();
            
            if (data.telemetry) {
                this.loadTelemetryInfo(data.telemetry);
            }
            
            if (data.agent1) {
                this.addContentToAgent('agent1', this.formatMarkdown(data.agent1));
                this.updateAgentBadge('agent1', 'complete', 'Complete');
                this.updateProgress('telemetry', 'complete', 'Done');
                this.updateProgress('agent1', 'complete', 'Done');
            }
            
            if (data.agent2) {
                this.addContentToAgent('agent2', this.formatMarkdown(data.agent2));
                this.updateAgentBadge('agent2', 'complete', 'Complete');
                this.updateProgress('agent2', 'complete', 'Done');
            }
            
            if (data.agent3) {
                this.addContentToAgent('agent3', this.formatMarkdown(data.agent3));
                this.updateAgentBadge('agent3', 'complete', 'Complete');
                this.updateProgress('agent3', 'complete', 'Done');
                this.downloadPdfBtn.disabled = false;
                this.setSystemStatus('complete', 'Ready');
            }
            
            this.setRunning(false);
            
        } catch (error) {
            console.error('Failed to load report:', error);
        }
    }
    
    loadTelemetryInfo(telemetry) {
        const tel = telemetry || {};
        
        document.getElementById('hostInfo').textContent = tel.host?.node || 'Unknown';
        document.getElementById('osInfo').textContent = `${tel.host?.system || ''} ${tel.host?.release || ''}`.trim() || 'Unknown';
        document.getElementById('cpuInfo').textContent = `${tel.cpu?.usage_percent_interval_0_5s || 0}%`;
        document.getElementById('memInfo').textContent = `${tel.memory?.virtual?.percent || 0}%`;
        document.getElementById('procCount').textContent = tel.processes?.length || '0';
        document.getElementById('connCount').textContent = tel.network_connections?.length || '0';
    }
    
    formatMarkdown(text) {
        if (!text) return '';
        
        let html = text
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/^---$/gm, '<hr>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\s*<ul>/g, '');
        
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-3]>)/g, '$1');
        html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        
        return html;
    }
    
    async downloadPdf() {
        window.location.href = '/api/download/pdf';
        this.showToast('PDF download started', 'info');
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new GroundTraceDashboard();
});

/**
 * GroundTrace Dashboard - Real-time Security Analysis
 * Shows command execution, AI prompts, and agent thinking in real-time
 */

class GroundTraceDashboard {
    constructor() {
        this.executeBtn = document.getElementById('executeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.statusValue = document.getElementById('statusValue');
        this.phaseValue = document.getElementById('phaseValue');
        this.modelValue = document.getElementById('modelValue');
        this.commandCount = document.getElementById('commandCount');
        
        this.commandOutput = document.getElementById('commandOutput');
        this.agentThinking = {
            agent1: document.getElementById('agent1Thinking'),
            agent2: document.getElementById('agent2Thinking'),
            agent3: document.getElementById('agent3Thinking')
        };
        
        this.isRunning = false;
        this.eventSource = null;
        this.commandCountValue = 0;
        
        this.init();
    }
    
    init() {
        this.executeBtn.addEventListener('click', () => this.execute());
        this.downloadBtn.addEventListener('click', () => this.download());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        this.addTerminalLine('system', 'GroundTrace Security Analysis System');
        this.addTerminalLine('info', 'Ready for analysis. Click "Execute Analysis" to begin.');
        this.addTerminalLine('info', 'This system will:');
        this.addTerminalLine('info', '  1. Collect real-time telemetry from your system');
        this.addTerminalLine('info', '  2. Execute commands and show raw outputs');
        this.addTerminalLine('info', '  3. Send prompts to AI agents');
        this.addTerminalLine('info', '  4. Show AI thinking in real-time');
    }
    
    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }
    
    async execute() {
        if (this.isRunning) return;
        
        this.reset();
        this.setRunning(true);
        
        this.addTerminalLine('command', '>>> Starting GroundTrace Analysis...');
        this.updateTimeline('telemetry', 'active');
        
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
            this.addTerminalLine('error', `Failed to start: ${error.message}`);
            this.setRunning(false);
        }
    }
    
    startStreaming() {
        this.eventSource = new EventSource('/api/stream');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleEvent(data);
        };
        
        this.eventSource.onerror = () => {
            this.eventSource.close();
        };
    }
    
    handleEvent(data) {
        switch (data.type) {
            case 'phase':
                this.handlePhase(data);
                break;
            case 'command':
                this.handleCommand(data);
                break;
            case 'agent_chunk':
                this.handleAgentChunk(data);
                break;
            case 'prompts':
                this.handlePrompts(data);
                break;
            case 'complete':
                this.handleComplete();
                break;
            case 'error':
                this.handleError(data);
                break;
        }
    }
    
    handlePhase(data) {
        const { phase, status, message } = data;
        
        this.addTerminalLine('info', `[${phase.toUpperCase()}] ${message}`);
        this.phaseValue.textContent = phase.toUpperCase();
        this.statusValue.textContent = status.toUpperCase();
        
        if (phase === 'telemetry') {
            this.updateTimeline('telemetry', status === 'complete' ? 'complete' : 'active');
            if (status === 'complete') {
                this.updateTimeline('agent1', 'active');
                this.loadTelemetryData();
            }
        } else if (phase === 'agent1' && status === 'starting') {
            this.updateTimeline('agent1', 'active');
        } else if (phase === 'complete') {
            this.updateTimeline('agent3', 'complete');
        }
    }
    
    handleCommand(data) {
        const { command, category, description, status, output, error, duration_ms } = data;
        
        this.commandCountValue++;
        this.commandCount.textContent = this.commandCountValue;
        
        const statusClass = status === 'success' ? 'success' : status === 'error' ? 'error' : 'info';
        
        this.addTerminalLine('command', `[${category}] ${description}`);
        this.addTerminalLine(statusClass, `  Status: ${status.toUpperCase()} | Duration: ${duration_ms.toFixed(0)}ms`);
        
        if (output) {
            const truncated = output.length > 300 ? output.substring(0, 300) + '...' : output;
            this.addTerminalLine('output', `  Output: ${truncated}`);
        }
        
        if (error) {
            this.addTerminalLine('error', `  Error: ${error}`);
        }
    }
    
    handleAgentChunk(data) {
        const { agent, chunk, full_output } = data;
        
        if (this.agentThinking[agent]) {
            this.agentThinking[agent].innerHTML = this.formatMarkdown(full_output);
            
            if (agent === 'agent1') {
                this.updateTimeline('agent1', 'complete');
                this.updateTimeline('agent2', 'active');
            } else if (agent === 'agent2') {
                this.updateTimeline('agent2', 'complete');
                this.updateTimeline('agent3', 'active');
            } else if (agent === 'agent3') {
                this.updateTimeline('agent3', 'complete');
            }
        }
    }
    
    handlePrompts(data) {
        const prompts = data.prompts;
        
        document.getElementById('prompt1Content').textContent = 'System Prompt: You are Agent 1 (Telemetry Analyst). Analyze the provided JSON snapshot and extract key facts about the system.';
        document.getElementById('prompt2Content').textContent = 'System Prompt: You are Agent 2 (Attack Surface Mapper). Map potential attack vectors based on observed telemetry.';
        document.getElementById('prompt3Content').textContent = 'System Prompt: You are Agent 3 (Tabletop Scenario Author). Generate defensive security scenarios for training purposes.';
    }
    
    handleComplete() {
        this.eventSource.close();
        this.setRunning(false);
        this.statusValue.textContent = 'COMPLETE';
        this.phaseValue.textContent = 'DONE';
        this.downloadBtn.disabled = false;
        
        this.addTerminalLine('success', '\n========================================');
        this.addTerminalLine('success', 'ANALYSIS COMPLETE');
        this.addTerminalLine('success', '========================================');
        
        this.showToast('Analysis complete! Download PDF report.', 'success');
    }
    
    handleError(data) {
        this.eventSource.close();
        this.setRunning(false);
        this.statusValue.textContent = 'ERROR';
        
        this.addTerminalLine('error', `\nERROR: ${data.message}`);
        if (data.trace) {
            this.addTerminalLine('error', data.trace);
        }
        
        this.showToast('Analysis failed: ' + data.message, 'error');
    }
    
    async loadTelemetryData() {
        try {
            const response = await fetch('/api/telemetry');
            const tel = await response.json();
            
            // Update system info
            document.getElementById('sysHostname').textContent = tel.host?.node || '-';
            document.getElementById('sysOS').textContent = `${tel.host?.system || ''} ${tel.host?.release || ''}`;
            document.getElementById('sysCPU').textContent = `${tel.cpu?.usage_percent_interval_0_5s || 0}%`;
            document.getElementById('sysMemory').textContent = `${tel.memory?.virtual?.percent || 0}%`;
            document.getElementById('sysProcesses').textContent = tel.processes?.length || 0;
            document.getElementById('sysConnections').textContent = tel.network_connections?.length || 0;
            
            // Update metrics
            document.getElementById('metricCPU').textContent = `${tel.cpu?.usage_percent_interval_0_5s || 0}%`;
            document.getElementById('metricMemory').textContent = `${tel.memory?.virtual?.percent || 0}%`;
            document.getElementById('metricDisk').textContent = tel.disks?.[0]?.percent_used ? `${tel.disks[0].percent_used}%` : '-';
            
            const netIO = tel.network_io;
            if (netIO) {
                const sent = this.formatBytes(netIO.bytes_sent || 0);
                const recv = this.formatBytes(netIO.bytes_recv || 0);
                document.getElementById('metricNetIO').textContent = `${sent}/${recv}`;
            }
            
            // Update process list
            this.updateProcessList(tel.processes || []);
            
        } catch (error) {
            console.error('Failed to load telemetry:', error);
        }
    }
    
    updateProcessList(processes) {
        const list = document.getElementById('processList');
        list.innerHTML = '';
        
        processes.slice(0, 8).forEach(p => {
            const item = document.createElement('div');
            item.className = 'process-item';
            item.innerHTML = `
                <span class="process-name">${p.name || 'Unknown'}</span>
                <span class="process-rss">${this.formatBytes(p.rss_bytes || 0)}</span>
            `;
            list.appendChild(item);
        });
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    updateTimeline(phase, status) {
        const item = document.querySelector(`.timeline-item[data-phase="${phase}"]`);
        if (item) {
            item.classList.remove('active', 'complete', 'error');
            item.classList.add(status);
            
            const statusEl = item.querySelector('.timeline-status');
            if (statusEl) {
                statusEl.textContent = status === 'active' ? 'Running...' : 
                                       status === 'complete' ? 'Complete' : 
                                       status === 'error' ? 'Error' : 'Pending';
            }
        }
    }
    
    addTerminalLine(type, message) {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.commandOutput.appendChild(line);
        this.commandOutput.scrollTop = this.commandOutput.scrollHeight;
    }
    
    formatMarkdown(text) {
        if (!text) return '';
        
        // Basic markdown formatting
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\n/g, '<br>');
        
        return html;
    }
    
    reset() {
        this.commandCountValue = 0;
        this.commandCount.textContent = '0';
        this.commandOutput.innerHTML = '';
        
        Object.values(this.agentThinking).forEach(el => {
            el.innerHTML = '<em style="color: var(--text-muted);">Waiting for execution...</em>';
        });
        
        document.querySelectorAll('.timeline-item').forEach(item => {
            item.classList.remove('active', 'complete', 'error');
        });
        
        this.modelValue.textContent = '-';
        this.downloadBtn.disabled = true;
    }
    
    setRunning(running) {
        this.isRunning = running;
        this.executeBtn.disabled = running;
        this.statusValue.textContent = running ? 'RUNNING' : 'READY';
        this.phaseValue.textContent = running ? 'STARTING' : 'IDLE';
    }
    
    async download() {
        window.location.href = '/api/download/pdf';
        this.showToast('PDF report download started', 'info');
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        
        toast.innerHTML = `
            <span>${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new GroundTraceDashboard();
});

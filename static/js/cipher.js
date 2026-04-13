/**
 * Cipher - Real Security Intelligence Dashboard
 * All outputs are 100% real - no simulation
 */

class CipherDashboard {
    constructor() {
        this.executeBtn = document.getElementById('executeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.terminalOutput = document.getElementById('terminalOutput');
        this.isRunning = false;
        this.eventSource = null;
        this.commandCount = 0;

        this.init();
    }

    init() {
        this.executeBtn.addEventListener('click', () => this.execute());
        this.downloadBtn.addEventListener('click', () => this.download());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${tabId}`).classList.add('active');
    }

    async execute() {
        if (this.isRunning) return;

        this.reset();
        this.setRunning(true);

        this.log('command', '▶ Cipher Security Analysis Starting...');
        this.log('info', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.updateStep('telemetry', 'active');

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
            this.log('error', `Failed to start: ${error.message}`);
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
            case 'prompt':
                this.handlePrompt(data);
                break;
            case 'agent_chunk':
                this.handleAgentChunk(data);
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

        this.log('info', `[${phase.toUpperCase()}] ${message}`);
        document.getElementById('metricPhase').textContent = phase.toUpperCase();

        if (phase === 'telemetry') {
            this.updateStep('telemetry', status === 'complete' ? 'complete' : 'active');
            if (status === 'complete') {
                this.updateStep('agent1', 'active');
                this.loadTelemetry();
            }
        } else if (phase === 'agent1' && status === 'starting') {
            this.updateStep('agent1', 'active');
        } else if (phase === 'complete') {
            this.updateStep('agent3', 'complete');
        }
    }

    handleCommand(data) {
        this.commandCount++;
        document.getElementById('metricCommands').textContent = this.commandCount;

        const { category, description, status, output, duration_ms } = data;

        this.log('command', `[${category}] ${description}`);
        this.log(status === 'success' ? 'success' : 'error', `   → ${status.toUpperCase()} (${duration_ms.toFixed(0)}ms)`);

        if (output) {
            const lines = output.split('\n').slice(0, 5);
            lines.forEach(line => {
                this.log('output', `   ${line}`);
            });
            if (output.split('\n').length > 5) {
                this.log('output', '   ...');
            }
        }
    }

    handlePrompt(data) {
        const { agent, name, prompt } = data;
        
        this.log('info', '');
        this.log('info', '╔══════════════════════════════════════════════════════════════════════╗');
        this.log('prompt', `║ ${name.toUpperCase()}`);
        this.log('prompt', '╚══════════════════════════════════════════════════════════════════════╝');
        this.log('info', '┌─ SYSTEM PROMPT SENT TO AI:');
        
        // Split prompt into lines and log each
        const lines = prompt.split('\n').slice(0, 30);
        lines.forEach(line => {
            this.log('prompt', `│ ${line}`);
        });
        if (prompt.split('\n').length > 30) {
            this.log('prompt', '│ ... (truncated)');
        }
        this.log('info', '└───────────────────────────────────────────────────────────────────────');
        
        this.commandCount++;
        document.getElementById('metricCommands').textContent = this.commandCount;
    }

    handleAgentChunk(data) {
        const { agent, full_output } = data;

        const contentEl = document.getElementById(`${agent}Content`);
        if (contentEl) {
            contentEl.innerHTML = this.formatMarkdown(full_output);
        }

        if (agent === 'agent1') {
            this.updateStep('agent1', 'complete');
            this.updateStep('agent2', 'active');
        } else if (agent === 'agent2') {
            this.updateStep('agent2', 'complete');
            this.updateStep('agent3', 'active');
        } else if (agent === 'agent3') {
            this.updateStep('agent3', 'complete');
        }
    }

    handleComplete() {
        this.eventSource.close();
        this.setRunning(false);
        this.setStatus('complete');
        document.getElementById('metricPhase').textContent = 'DONE';
        this.downloadBtn.disabled = false;

        this.log('success', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.log('success', '✓ Analysis Complete');
        this.log('success', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.showToast('Analysis complete. Download your report.', 'success');
    }

    handleError(data) {
        this.eventSource.close();
        this.setRunning(false);
        this.setStatus('error');

        this.log('error', `ERROR: ${data.message}`);
        this.showToast('Analysis failed', 'error');
    }

    async loadTelemetry() {
        try {
            const response = await fetch('/api/telemetry');
            const tel = await response.json();

            document.getElementById('metricHost').textContent = tel.host?.node || 'Unknown';
            document.getElementById('metricModel').textContent = 'DeepSeek';

            document.getElementById('statCPU').textContent = `${tel.cpu?.usage_percent_interval_0_5s || 0}%`;
            document.getElementById('statMemory').textContent = `${tel.memory?.virtual?.percent || 0}%`;
            document.getElementById('statDisk').textContent = `${tel.disks?.[0]?.percent_used || 0}%`;

            const netIO = tel.network_io;
            if (netIO) {
                const sent = this.formatBytes(netIO.bytes_sent || 0);
                const recv = this.formatBytes(netIO.bytes_recv || 0);
                document.getElementById('statNet').textContent = `${sent}/${recv}`;
            }

            this.updateProcessList(tel.processes || []);

        } catch (error) {
            console.error('Failed to load telemetry:', error);
        }
    }

    updateProcessList(processes) {
        const list = document.getElementById('processList');
        list.innerHTML = '';

        processes.slice(0, 6).forEach(p => {
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

    updateStep(step, status) {
        const el = document.getElementById(`step-${step}`);
        if (el) {
            el.classList.remove('active', 'complete', 'error');
            el.classList.add(status);

            const statusEl = el.querySelector('.step-status');
            if (statusEl) {
                statusEl.textContent = status === 'active' ? 'Running...' :
                                      status === 'complete' ? 'Complete' :
                                      status === 'error' ? 'Error' : 'Pending';
            }
        }
    }

    setStatus(status) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');

        dot.className = 'status-dot ' + status;
        text.textContent = status === 'complete' ? 'Complete' :
                          status === 'running' ? 'Running' :
                          status === 'error' ? 'Error' : 'Ready';
    }

    setRunning(running) {
        this.isRunning = running;
        this.executeBtn.disabled = running;
        this.setStatus(running ? 'running' : 'ready');
    }

    log(type, message) {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = message;
        this.terminalOutput.appendChild(line);
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    formatMarkdown(text) {
        if (!text) return '';

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
        this.commandCount = 0;
        document.getElementById('metricCommands').textContent = '0';
        document.getElementById('metricPhase').textContent = '—';
        document.getElementById('metricModel').textContent = '—';
        document.getElementById('metricHost').textContent = '—';
        document.getElementById('statCPU').textContent = '—';
        document.getElementById('statMemory').textContent = '—';
        document.getElementById('statDisk').textContent = '—';
        document.getElementById('statNet').textContent = '—';

        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active', 'complete', 'error');
        });

        this.terminalOutput.innerHTML = `
            <div class="terminal-line system">Cipher Security Analysis System</div>
            <div class="terminal-line system">All data is collected in real-time from your system.</div>
            <div class="terminal-line info">Click "Execute Analysis" to begin the security scan.</div>
        `;

        ['agent1', 'agent2', 'agent3'].forEach(id => {
            const el = document.getElementById(`${id}Content`);
            el.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">📊</div>
                    <p>Agent output will appear here in real-time</p>
                </div>
            `;
        });

        this.downloadBtn.disabled = true;
    }

    download() {
        window.location.href = '/api/download/pdf';
        this.showToast('PDF report downloading...', 'info');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';

        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.Cipher = new CipherDashboard();
});

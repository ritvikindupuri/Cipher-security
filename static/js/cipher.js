/**
 * Cipher Dashboard - Real-time Security Analysis
 */

class CipherDashboard {
    constructor() {
        this.executeBtn = document.getElementById('executeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.commandLog = document.getElementById('commandLog');
        this.isRunning = false;
        this.eventSource = null;
        this.agentOutputs = { agent1: '', agent2: '', agent3: '' };
        this.currentFullOutputTab = 'observations';
        this.phaseEnded = { agent1: false, agent2: false, agent3: false };
        this.agentThinkingCount = { agent1: 0, agent2: 0, agent3: 0 };
        
        this.AGENT_NAMES = {
            'agent1': 'Observations',
            'agent2': 'Threats',
            'agent3': 'Scenarios'
        };
        
        this.AGENT_CLASSES = {
            'agent1': 'observations',
            'agent2': 'threats',
            'agent3': 'scenarios'
        };

        this.THINKING_MESSAGES = {
            'agent1': [
                'Examining system telemetry data structure...',
                'Analyzing CPU metrics and usage patterns...',
                'Reviewing memory allocation across processes...',
                'Scanning for unusual network activity...',
                'Cross-referencing process list with known patterns...',
                'Identifying potential anomalies in system state...',
                'Compiling factual observations from telemetry...',
                'Preparing structured analysis report...'
            ],
            'agent2': [
                'Reviewing observations from telemetry analysis...',
                'Mapping identified patterns to potential attack vectors...',
                'Evaluating network connections for suspicious activity...',
                'Assessing process vulnerabilities and exposures...',
                'Correlating data points to attack surface...',
                'Generating hypothetical attack scenarios...',
                'Applying MITRE ATT&CK framework mapping...',
                'Documenting threat intelligence findings...'
            ],
            'agent3': [
                'Synthesizing threat intelligence into defensive scenarios...',
                'Constructing MITRE ATT&CK aligned attack chains...',
                'Defining detection requirements for each phase...',
                'Mapping attack progression from initial access to impact...',
                'Identifying telemetry gaps in current coverage...',
                'Generating tabletop exercise narrative...',
                'Developing detection rule recommendations...',
                'Finalizing defensive scenario documentation...'
            ]
        };

        this.init();
    }

    init() {
        this.executeBtn.addEventListener('click', () => this.execute());
        this.downloadBtn.addEventListener('click', () => this.download());

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.querySelectorAll('.full-output-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFullOutput(e.target.dataset.output));
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${tabId}`).classList.add('active');
        
        if (tabId === 'agents') {
            this.updateFullOutputDisplay();
        }
    }

    switchFullOutput(agentKey) {
        this.currentFullOutputTab = agentKey;
        
        document.querySelectorAll('.full-output-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-output="${agentKey}"]`).classList.add('active');
        
        this.updateFullOutputDisplay();
    }

    updateFullOutputDisplay() {
        const outputEl = document.getElementById('fullOutputText');
        const outputMap = {
            'observations': this.agentOutputs.agent1,
            'threats': this.agentOutputs.agent2,
            'scenarios': this.agentOutputs.agent3
        };
        
        const output = outputMap[this.currentFullOutputTab];
        
        if (output && output.length > 0) {
            outputEl.classList.remove('loading');
            outputEl.textContent = output;
        } else {
            outputEl.classList.add('loading');
            const agentNames = { observations: 'Observations', threats: 'Threats', scenarios: 'Scenarios' };
            outputEl.textContent = 'Awaiting ' + agentNames[this.currentFullOutputTab] + ' output...';
        }
    }

    getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour12: false });
    }

    getNextThinkingMessage(agent) {
        const messages = this.THINKING_MESSAGES[agent] || [];
        const idx = this.agentThinkingCount[agent] % messages.length;
        this.agentThinkingCount[agent]++;
        return messages[idx];
    }

    async execute() {
        if (this.isRunning) return;

        this.reset();
        this.setRunning(true);
        this.logHeader('SECURITY ANALYSIS STARTING', 'system');
        this.log('info', 'System', 'Initiating telemetry collection and AI-powered security analysis...');
        this.updateStep(1, 'active');

        try {
            const response = await fetch('/api/execute', { method: 'POST' });
            const data = await response.json();
            if (data.error) {
                this.showToast(data.error);
                this.setRunning(false);
                return;
            }
            this.startStreaming();
        } catch (error) {
            this.log('error', 'System', `Failed to start: ${error.message}`);
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

        if (phase === 'telemetry') {
            if (status === 'complete') {
                this.updateStep(1, 'complete');
                this.updateStep(2, 'active');
                this.log('success', 'System', message);
            }
        } else if (phase === 'agent1' && status === 'starting') {
            this.updateStep(2, 'active');
            this.logSection('OBSERVATION AGENT', 'observations');
            this.log('info', 'System', 'Observation Agent is starting analysis of system telemetry...');
        } else if (phase === 'agent2' && status === 'starting') {
            this.updateStep(2, 'complete');
            this.updateStep(3, 'active');
            this.logSection('THREAT AGENT', 'threats');
            this.log('info', 'System', 'Threat Agent is starting attack surface mapping...');
        } else if (phase === 'agent3' && status === 'starting') {
            this.updateStep(3, 'complete');
            this.updateStep(4, 'active');
            this.logSection('SCENARIO AGENT', 'scenarios');
            this.log('info', 'System', 'Scenario Agent is starting MITRE ATT&CK scenario generation...');
        } else if (phase === 'complete') {
            this.updateStep(4, 'complete');
        }
    }

    handleCommand(data) {
        const { category, description, status, output, error, command } = data;

        this.log('command', 'System', `[${category}] ${description}`);
        
        if (command) {
            this.log('exec', 'System', `$ ${command}`);
        }

        if (status === 'success' && output) {
            this.log('output', 'System', output.substring(0, 300));
            
            if (category === 'CPU') {
                const match = output.match(/(\d+\.?\d*)%/);
                if (match) {
                    const val = match[1];
                    document.getElementById('metricCPU').textContent = val + '%';
                    document.getElementById('chartCPU').style.width = val + '%';
                    document.getElementById('chartCPUVal').textContent = val + '%';
                }
            }
        } else if (status === 'error' && error) {
            this.log('error', 'System', error);
        }
    }

    handlePrompt(data) {
        const { agent, name, prompt } = data;
        const agentName = this.AGENT_NAMES[agent] || name || agent;
        const agentClass = this.AGENT_CLASSES[agent] || 'system';

        this.log('info', 'System', `${agentName} Agent initialized with analysis directives.`);

        const block = document.createElement('div');
        block.className = 'log-block ' + agentClass;
        block.innerHTML = `
            <div class="log-header">
                <span class="log-timestamp">${this.getTimestamp()}</span>
                <span class="agent-badge ${agentClass}">${agentName}</span>
                <span class="log-label">SYSTEM PROMPT</span>
            </div>
            <div class="log-content prompt-content">
                <div class="prompt-description">Analysis directives sent to DeepSeek AI:</div>
                <pre class="prompt-text">${this.escapeHtml(prompt)}</pre>
            </div>
        `;
        this.commandLog.appendChild(block);
        this.scrollLog();
    }

    handleAgentChunk(data) {
        const { agent, chunk, full_output } = data;
        this.agentOutputs[agent] = full_output;
        
        const agentName = this.AGENT_NAMES[agent] || agent;
        const agentClass = this.AGENT_CLASSES[agent] || 'system';

        if (!this.phaseEnded[agent]) {
            this.phaseEnded[agent] = true;
            
            const thinkingMsg = this.getNextThinkingMessage(agent);
            this.log('thinking', agentName, thinkingMsg);
        } else {
            const msgCount = this.agentThinkingCount[agent];
            if (msgCount > 0 && msgCount % 3 === 0) {
                const thinkingMsg = this.getNextThinkingMessage(agent);
                this.log('thinking', agentName, thinkingMsg);
            }
        }

        this.scrollLog();

        if (agent === 'agent1') {
            this.updateObservationsViz(full_output);
        } else if (agent === 'agent2') {
            this.updateThreatsViz(full_output);
        } else if (agent === 'agent3') {
            this.updateScenariosViz(full_output);
        }
        
        this.updateFullOutputDisplay();
    }

    scrollLog() {
        this.commandLog.scrollTop = this.commandLog.scrollHeight;
    }

    logHeader(message, type) {
        const block = document.createElement('div');
        block.className = 'log-header-block ' + type;
        block.innerHTML = `
            <div class="header-line"></div>
            <div class="header-text">${this.escapeHtml(message)}</div>
            <div class="header-line"></div>
        `;
        this.commandLog.appendChild(block);
        this.scrollLog();
    }

    logSection(message, type) {
        const block = document.createElement('div');
        block.className = 'log-header-block ' + type;
        block.innerHTML = `
            <div class="header-line"></div>
            <div class="header-text">${this.escapeHtml(message)}</div>
            <div class="header-line"></div>
        `;
        this.commandLog.appendChild(block);
        this.scrollLog();
    }

    log(type, agent, message) {
        const block = document.createElement('div');
        block.className = 'log-entry ' + type;
        
        const agentClass = agent === 'System' ? 'system' : 
                          agent === 'Observations' ? 'observations' :
                          agent === 'Threats' ? 'threats' :
                          agent === 'Scenarios' ? 'scenarios' : 'system';

        let icon = '';
        let content = this.escapeHtml(message);
        
        switch(type) {
            case 'info':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
                break;
            case 'success':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
                break;
            case 'command':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
                break;
            case 'exec':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                content = message;
                break;
            case 'output':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
                break;
            case 'thinking':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><circle cx="12" cy="12" r="3"/></svg>';
                break;
            case 'error':
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                break;
            default:
                icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
        }

        block.innerHTML = `
            <span class="log-timestamp">${this.getTimestamp()}</span>
            <span class="agent-badge ${agentClass}">${agent}</span>
            <span class="log-icon">${icon}</span>
            <span class="log-message">${content}</span>
        `;

        this.commandLog.appendChild(block);
        this.scrollLog();
    }

    updateObservationsViz(output) {
        const cpuMatch = output.match(/(?:CPU|cpu)[:\s]*(\d+\.?\d*)%/i);
        const memMatch = output.match(/(?:Memory|memory|RAM)[:\s]*(\d+\.?\d*)%/i);
        const diskMatch = output.match(/(?:Disk|disk)[:\s]*(\d+\.?\d*)%/i);

        if (cpuMatch) {
            const val = cpuMatch[1];
            document.getElementById('chartCPU').style.width = val + '%';
            document.getElementById('chartCPUVal').textContent = val + '%';
            document.getElementById('metricCPU').textContent = val + '%';
        }
        if (memMatch) {
            const val = memMatch[1];
            document.getElementById('chartMemory').style.width = val + '%';
            document.getElementById('chartMemoryVal').textContent = val + '%';
            document.getElementById('metricMemory').textContent = val + '%';
        }
        if (diskMatch) {
            const val = diskMatch[1];
            document.getElementById('chartDisk').style.width = val + '%';
            document.getElementById('chartDiskVal').textContent = val + '%';
            document.getElementById('metricDisk').textContent = val + '%';
        }
        
        const processTable = document.getElementById('processTable');
        const lines = output.split('\n');
        const processRows = [];
        
        for (const line of lines) {
            const cleanLine = line.trim();
            const memMatch = cleanLine.match(/(\d+\.?\d*)\s*(MB|GB)/i);
            const pidMatch = cleanLine.match(/pid[:\s]*(\d+)/i);
            
            if ((memMatch || pidMatch) && cleanLine.length > 5) {
                let name = cleanLine.split(/\s+/)[0];
                if (!name || name.length < 2) name = cleanLine.substring(0, 20).trim();
                
                const pid = pidMatch ? pidMatch[1] : 'N/A';
                const mem = memMatch ? memMatch[1] + ' ' + memMatch[2] : 'N/A';
                
                if (name.length > 2) {
                    processRows.push(`<tr>
                        <td class="process-name">${this.escapeHtml(name.substring(0, 25))}</td>
                        <td class="process-pid">${this.escapeHtml(pid)}</td>
                        <td class="process-memory">${this.escapeHtml(mem)}</td>
                    </tr>`);
                }
            }
            
            if (processRows.length >= 8) break;
        }
        
        if (processRows.length > 0) {
            processTable.innerHTML = processRows.join('');
        }
    }

    updateThreatsViz(output) {
        const threatList = document.getElementById('threatList');
        const threats = [];
        
        const lines = output.split('\n');
        let currentItem = null;
        
        for (const line of lines) {
            const cleanLine = line.replace(/^[\s\-\*\>\#]+/, '').trim();
            
            if (cleanLine.match(/HYPOTHESIS|Layer B|Scenario/i) && cleanLine.includes(':')) {
                if (currentItem && currentItem.title) {
                    threats.push(currentItem);
                }
                const parts = cleanLine.split(':');
                currentItem = {
                    title: (parts[1] || cleanLine).substring(0, 80).trim(),
                    severity: cleanLine.toLowerCase().includes('high') || cleanLine.toLowerCase().includes('critical') ? 'high' : 'medium',
                    mitre: []
                };
            }
            
            if (currentItem) {
                const mitreCodes = cleanLine.match(/T\d{4}[\.\d]*/g);
                if (mitreCodes) {
                    currentItem.mitre.push(...mitreCodes);
                }
                
                if (cleanLine.match(/Severity.*HIGH/i)) currentItem.severity = 'high';
                if (cleanLine.match(/Severity.*MEDIUM/i) && currentItem.severity !== 'high') currentItem.severity = 'medium';
                
                if (cleanLine.match(/security relevance|exploit|attack motivation/i) && cleanLine.length > 15) {
                    currentItem.desc = cleanLine.substring(0, 100);
                }
            }
        }
        
        if (currentItem && currentItem.title) {
            threats.push(currentItem);
        }
        
        const riskLines = lines.filter(l => 
            (l.includes('risk') || l.includes('threat') || l.includes('WARNING') || l.includes('concern') || l.includes('anomaly')) &&
            l.length > 20 &&
            !l.includes('HYPOTHESIS') &&
            !l.includes('### ')
        );
        
        riskLines.slice(0, 4).forEach(line => {
            const cleanLine = line.replace(/^[\s\-\*\>\#]+/, '').trim();
            if (cleanLine.length > 15 && !threats.find(t => t.title.includes(cleanLine.substring(0, 30)))) {
                threats.push({
                    title: cleanLine.substring(0, 100),
                    severity: line.toLowerCase().includes('high') || line.includes('WARNING') ? 'high' : 'medium',
                    mitre: line.match(/T\d{4}[\.\d]*/g) || []
                });
            }
        });
        
        if (threats.length > 0) {
            threatList.innerHTML = threats.slice(0, 6).map(t => `
                <div class="attack-item">
                    <div class="attack-severity ${t.severity}"></div>
                    <div class="attack-content">
                        <div class="attack-title">${this.escapeHtml(t.title)}</div>
                        ${t.mitre.slice(0, 3).map(m => `<span class="attack-mitre">${m}</span>`).join(' ')}
                    </div>
                </div>
            `).join('');
        } else {
            threatList.innerHTML = '<div style="color: var(--text-secondary); font-size: 12px;">Analyzing threat landscape...</div>';
        }
    }

    updateScenariosViz(output) {
        const tbody = document.getElementById('scenarioTable');
        const phases = [
            { phase: 'Initial Access', mitre: 'TA0001' },
            { phase: 'Execution', mitre: 'TA0002' },
            { phase: 'Persistence', mitre: 'TA0003' },
            { phase: 'Privilege Escalation', mitre: 'TA0004' },
            { phase: 'Defense Evasion', mitre: 'TA0005' },
            { phase: 'C2 / Exfiltration', mitre: 'TA0011/TA0010' }
        ];
        
        const lines = output.split('\n');
        const phaseData = {};
        
        let currentPhase = null;
        let currentSection = null;
        
        for (const line of lines) {
            const cleanLine = line.replace(/^[\s\-\*\>\#]+/, '').trim();
            
            for (const p of phases) {
                if (cleanLine.toLowerCase().includes(p.phase.toLowerCase()) && 
                    (cleanLine.includes('Phase') || cleanLine.includes('Attack'))) {
                    currentPhase = p.phase;
                    if (!phaseData[currentPhase]) {
                        phaseData[currentPhase] = { evidence: [], detection: [], mitre: [] };
                    }
                }
            }
            
            if (cleanLine.toLowerCase().includes('artifact') || 
                cleanLine.toLowerCase().includes('observe') ||
                cleanLine.toLowerCase().includes('would see')) {
                currentSection = 'evidence';
            }
            if (cleanLine.toLowerCase().includes('detection') || 
                cleanLine.toLowerCase().includes('monitor') ||
                cleanLine.toLowerCase().includes('signal') ||
                cleanLine.toLowerCase().includes('alert')) {
                currentSection = 'detection';
            }
            
            if (currentPhase && currentSection && cleanLine.length > 10) {
                const colonIndex = cleanLine.indexOf(':');
                if (colonIndex > 0 && colonIndex < cleanLine.length - 5) {
                    const value = cleanLine.substring(colonIndex + 1).trim();
                    if (value.length > 10) {
                        if (currentSection === 'evidence' && phaseData[currentPhase].evidence.length < 2) {
                            phaseData[currentPhase].evidence.push(value.substring(0, 80));
                        } else if (currentSection === 'detection' && phaseData[currentPhase].detection.length < 2) {
                            phaseData[currentPhase].detection.push(value.substring(0, 80));
                        }
                    }
                }
            }
            
            const mitreMatch = cleanLine.match(/T\d{4}[\.\d]*/g);
            if (mitreMatch && currentPhase) {
                phaseData[currentPhase].mitre.push(...mitreMatch);
            }
        }
        
        const rows = phases.map(p => {
            const data = phaseData[p.phase] || { evidence: [], detection: [], mitre: [] };
            
            const evidenceText = data.evidence.length > 0 
                ? data.evidence.slice(0, 2).join('; ')
                : 'No specific artifacts identified for this phase in current analysis';
            
            const detectionText = data.detection.length > 0
                ? data.detection.slice(0, 2).join('; ')
                : 'Monitor for ' + p.phase.toLowerCase() + ' indicators in process and network telemetry';
            
            const tacticText = data.mitre.length > 0
                ? data.mitre.slice(0, 2).join(', ')
                : 'Under analysis';
            
            return `<tr>
                <td><span class="phase-badge">${p.phase}</span></td>
                <td><span class="mitre-badge">${p.mitre}</span> ${this.escapeHtml(tacticText.substring(0, 50))}</td>
                <td>${this.escapeHtml(evidenceText)}</td>
                <td>${this.escapeHtml(detectionText)}</td>
            </tr>`;
        });

        tbody.innerHTML = rows.join('');
    }

    handleComplete() {
        this.eventSource.close();
        this.setRunning(false);
        this.setStatus('complete', 'Complete');
        this.downloadBtn.disabled = false;
        
        this.logHeader('ANALYSIS COMPLETE', 'success');
        this.log('success', 'System', 'Security analysis finished. Review agent outputs and visualizations.');
        
        this.updateFullOutputDisplay();
        this.showToast('Analysis complete');
    }

    handleError(data) {
        this.eventSource.close();
        this.setRunning(false);
        this.setStatus('error', 'Error');
        this.logHeader('ANALYSIS FAILED', 'error');
        this.log('error', 'System', data.message);
        this.showToast('Error: ' + data.message);
    }

    updateStep(num, status) {
        const step = document.getElementById(`step-${num}`);
        if (step) {
            step.classList.remove('active', 'complete');
            step.classList.add(status);
            const stepStatus = step.querySelector('.step-status');
            stepStatus.textContent = status === 'active' ? 'Running...' : 'Complete';
        }
    }

    setStatus(status, text) {
        const dot = document.getElementById('statusDot');
        const textEl = document.getElementById('statusText');
        dot.className = 'status-dot ' + status;
        textEl.textContent = text || status;
    }

    setRunning(running) {
        this.isRunning = running;
        this.executeBtn.disabled = running;
        this.setStatus(running ? 'running' : 'ready', running ? 'Running' : 'Ready');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    reset() {
        this.agentThinkingCount = { agent1: 0, agent2: 0, agent3: 0 };
        this.phaseEnded = { agent1: false, agent2: false, agent3: false };
        this.commandLog.innerHTML = '';

        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active', 'complete');
        });

        document.getElementById('metricCPU').textContent = '-';
        document.getElementById('metricMemory').textContent = '-';
        document.getElementById('metricDisk').textContent = '-';
        document.getElementById('metricNet').textContent = '-';

        document.getElementById('chartCPU').style.width = '0%';
        document.getElementById('chartMemory').style.width = '0%';
        document.getElementById('chartDisk').style.width = '0%';
        document.getElementById('chartNet').style.width = '0%';
        document.getElementById('chartCPUVal').textContent = '0%';
        document.getElementById('chartMemoryVal').textContent = '0%';
        document.getElementById('chartDiskVal').textContent = '0%';
        document.getElementById('chartNetVal').textContent = '0%';

        document.getElementById('processTable').innerHTML = '<tr><td colspan="3" style="color: var(--text-secondary)">Awaiting telemetry data...</td></tr>';
        document.getElementById('threatList').innerHTML = '<div style="color: var(--text-secondary); font-size: 12px;">Awaiting threat analysis...</div>';
        document.getElementById('scenarioTable').innerHTML = '<tr><td colspan="4" style="color: var(--text-secondary)">Awaiting scenario generation...</td></tr>';

        this.downloadBtn.disabled = true;
        this.agentOutputs = { agent1: '', agent2: '', agent3: '' };
        this.updateFullOutputDisplay();
    }

    download() {
        window.location.href = '/api/download/pdf';
        this.showToast('Downloading report...');
    }

    showToast(message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cipher = new CipherDashboard();
});

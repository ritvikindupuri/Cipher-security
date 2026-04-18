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
            outputEl.innerHTML = this.renderMarkdown(output);
        } else {
            outputEl.classList.add('loading');
            const agentNames = { observations: 'Observations', threats: 'Threats', scenarios: 'Scenarios' };
            outputEl.textContent = 'Awaiting ' + agentNames[this.currentFullOutputTab] + ' output...';
        }
    }

    renderMarkdown(text) {
        if (!text) return '';
        
        let html = this.escapeHtml(text);
        
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const label = lang ? lang.toUpperCase() : 'QUERY';
            return `<pre><code>${code}</code><button class="copy-btn" onclick="copyCode(this)">Copy</button></pre>`;
        });
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        html = html.replace(/(Severity:\s*)(HIGH|MEDIUM|LOW)/gi, (match, prefix, level) => {
            let explanation = '';
            if (level.toUpperCase() === 'HIGH') explanation = 'Significant exposure or critical asset at risk';
            else if (level.toUpperCase() === 'MEDIUM') explanation = 'Moderate exposure or partial visibility';
            else if (level.toUpperCase() === 'LOW') explanation = 'Minimal exposure or good controls in place';
            return `${prefix}${level} <span style="color: #888; font-size: 11px;">(${level} - ${explanation})</span>`;
        });
        
        html = html.replace(/\n\n+/g, '<br><br>');
        html = html.replace(/\n/g, '<br>');
        
        html = html.replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        const tableRows = [];
        const separatorIndices = [];
        const lines = html.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const rowMatch = line.match(/^\s*\|(.+)\|\s*$/);
            if (rowMatch) {
                const cells = rowMatch[1].split('|').map(c => c.trim());
                if (cells.every(c => /^-+$/.test(c))) {
                    separatorIndices.push(tableRows.length);
                } else {
                    tableRows.push(cells);
                }
            }
        }
        
        if (tableRows.length > 0) {
            let tableHtml = '<table><thead>';
            if (separatorIndices.length > 0) {
                tableHtml += '<tr>' + tableRows[0].map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
                for (let i = separatorIndices[0] + 1; i < tableRows.length; i++) {
                    tableHtml += '<tr>' + tableRows[i].map(c => `<td>${c}</td>`).join('') + '</tr>';
                }
            } else {
                tableHtml += '<tr>' + tableRows[0].map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
                for (let i = 1; i < tableRows.length; i++) {
                    tableHtml += '<tr>' + tableRows[i].map(c => `<td>${c}</td>`).join('') + '</tr>';
                }
            }
            tableHtml += '</tbody></table>';
            
            html = html.replace(/^\s*\|.+\|\s*$/gm, '').replace(/^\s*\|[-:\s|]+\|\s*$/gm, '');
            html = html.replace(/<\/table>\s*<table>/g, '');
            html += '\n' + tableHtml;
        }
        
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
        
        html = html.replace(/^---$/gm, '<hr>');
        
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><(h[1-3]|ul|ol|table|pre|blockquote|hr)/g, '<$1');
        html = html.replace(/<\/(h[1-3]|ul|ol|table|pre|blockquote)><\/p>/g, '</$1>');
        html = html.replace(/<p><hr><\/p>/g, '<hr>');
        html = html.replace(/<p><blockquote>/g, '<blockquote>');
        html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<hr><\/p>/g, '<hr>');
        
        return html;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            this.log('output', 'System', output.substring(0, 1500));
            
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
                <div class="prompt-description">Analysis directives sent to Claude AI:</div>
                <pre class="prompt-text">${this.escapeHtml(prompt)}</pre>
            </div>
        `;
        this.commandLog.appendChild(block);
        this.scrollLog();
    }

    handleAgentChunk(data) {
        const { agent, chunk, full_output } = data;
        console.log('Agent chunk received:', agent, 'output length:', full_output ? full_output.length : 0);
        this.agentOutputs[agent] = full_output;
        
        console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(p => p.includes('update')));
        
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
            console.log('Calling updateThreatsViz...');
            this.updateThreatsViz(full_output);
        } else if (agent === 'agent3') {
            console.log('Calling updateScenariosViz...');
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
        const cpuMatch = output.match(/\|\s*CPU\s*\|\s*(\d+)%?/i) || output.match(/(?:CPU|cpu)[:\s]*(\d+\.?\d*)%/i);
        const memMatch = output.match(/\|\s*Memory\s*\|\s*(\d+)%?/i) || output.match(/(?:Memory|memory|RAM)[:\s]*(\d+\.?\d*)%/i);
        const diskMatch = output.match(/\|\s*Disk\s*\|\s*(\d+)%?/i) || output.match(/(?:Disk|disk)[:\s]*(\d+\.?\d*)%/i);

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
        
        const netMatch = output.match(/(?:Network|Connections|Listening Ports)[:\s]*(\d+)/i) || output.match(/Listening ports[:\s]*(\d+)/i) || output.match(/Established connections[:\s]*(\d+)/i);
        if (netMatch) {
            const val = netMatch[1];
            document.getElementById('metricNet').textContent = val;
            document.getElementById('chartNet').style.width = Math.min(val, 100) + '%';
            document.getElementById('chartNetVal').textContent = val;
        }
        
        const processTable = document.getElementById('processTable');
        const processRows = [];
        const lines = output.split('\n');
        let inProcessSection = false;
        let systemOverview = '';
        let networkDetails = '';
        let securityObservations = [];
        
        for (const line of lines) {
            if (line.match(/## System Overview/i)) {
                const startIdx = output.indexOf(line);
                const endMatch = output.indexOf('##', startIdx + 1);
                if (endMatch > 0) {
                    systemOverview = output.substring(startIdx, endMatch).replace(/##/g, '').trim();
                }
            }
            
            if (line.match(/## Network Activity/i) || line.match(/Network Summary/i)) {
                const startIdx = output.indexOf(line);
                let endIdx = output.indexOf('##', startIdx + 1);
                if (endIdx < 0) endIdx = output.indexOf('## Security', startIdx);
                if (endIdx < 0) endIdx = output.length;
                networkDetails = output.substring(startIdx, endIdx).replace(/##/g, '').trim();
            }
            
            if (line.match(/## Security Observations/i)) {
                const startIdx = output.indexOf(line);
                const endMatch = output.indexOf('##', startIdx + 1);
                if (endMatch > 0) {
                    const secSection = output.substring(startIdx, endMatch);
                    const bulletPoints = secSection.match(/^- (.+)$/gm) || [];
                    securityObservations = bulletPoints.map(p => p.replace(/^- /, '').trim()).filter(p => p.length > 5);
                }
            }
            
            if (line.match(/Key Processes|Top Process|Process.*Memory/i)) {
                inProcessSection = true;
                continue;
            }
            if (line.match(/Network|Security Observation|Risk/i) && inProcessSection) {
                break;
            }
            
            if (inProcessSection) {
                const cleanLine = line.replace(/^[\|\-\s]+/, '').trim();
                if (cleanLine && cleanLine.length > 3) {
                    const parts = cleanLine.split(/\|/).map(p => p.trim()).filter(p => p);
                    if (parts.length >= 2) {
                        let name = parts[0].replace(/\*\*/g, '').trim();
                        let mem = parts.find(p => p.match(/\d+\s*(MB|GB)/i)) || parts[parts.length - 1];
                        let pid = parts.find(p => p.match(/^\d{3,5}$/)) || 'N/A';
                        
                        if (mem && !mem.match(/\d+\s*(MB|GB)/i)) mem = 'N/A';
                        
                        processRows.push(`<tr>
                            <td class="process-name" style="word-break: break-all; max-width: 150px;">${this.escapeHtml(name)}</td>
                            <td class="process-pid">${this.escapeHtml(String(pid))}</td>
                            <td class="process-memory">${this.escapeHtml(mem)}</td>
                        </tr>`);
                    }
                }
            }
            
            if (processRows.length >= 10) break;
        }
        
        let html = '';
        
        if (systemOverview) {
            html += `<div style="margin-bottom: 16px; padding: 12px; background: #f5f5f7; border-radius: 6px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #000;">System Overview</div>
                <div style="font-size: 12px; color: #333; white-space: pre-wrap;">${this.escapeHtml(systemOverview.substring(0, 300))}</div>
            </div>`;
        }
        
        if (networkDetails) {
            html += `<div style="margin-bottom: 16px; padding: 12px; background: #f5f5f7; border-radius: 6px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #000;">Network Activity</div>
                <div style="font-size: 12px; color: #333; white-space: pre-wrap;">${this.escapeHtml(networkDetails.substring(0, 300))}</div>
            </div>`;
        }
        
        if (securityObservations.length > 0) {
            html += `<div style="margin-bottom: 16px; padding: 12px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffc107;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #000;">Security Observations</div>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #333;">
                    ${securityObservations.slice(0, 5).map(o => `<li style="margin: 4px 0;">${this.escapeHtml(o.substring(0, 150))}</li>`).join('')}
                </ul>
            </div>`;
        }
        
        if (processRows.length > 0) {
            html += `<table class="process-table" style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                <thead><tr style="background: #eaeaeb;">
                    <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 600; color: #666;">Process</th>
                    <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 600; color: #666;">PID</th>
                    <th style="padding: 8px; text-align: left; font-size: 11px; font-weight: 600; color: #666;">Memory</th>
                </tr></thead>
                <tbody>${processRows.join('')}</tbody>
            </table>`;
        }
        
if (html) {
            processTable.innerHTML = html;
        }
    }

    updateThreatsViz(output) {
        const threatList = document.getElementById('threatList');
        const threats = [];
        
        const lines = output.split('\n');
        let currentRisk = null;
        
        for (const line of lines) {
            const cleanLine = line.replace(/^[\s\-\*\>\#]+/, '').trim();
            
            if (cleanLine.match(/\*\*Risk:\*\*/i) || cleanLine.match(/^\*\*Risk:\*\*/i)) {
                if (currentRisk && currentRisk.title) {
                    threats.push(currentRisk);
                }
                const title = cleanLine.replace(/\*\*/g, '').replace(/Risk:/i, '').trim();
                currentRisk = { title: title, severity: 'medium', severityReason: 'Awaiting analyst severity assessment', evidence: '', mitre: [], action: '' };
            }
            
            if (currentRisk) {
                if (cleanLine.match(/\*\*Severity:\*\*/i)) {
                    const sev = cleanLine.replace(/\*\*/g, '').replace(/Severity:/i, '').trim().toUpperCase();
                    currentRisk.severity = sev.includes('HIGH') || sev.includes('CRIT') ? 'high' : sev.includes('LOW') ? 'low' : 'medium';
                    if (sev.includes('CRIT')) currentRisk.severityReason = 'Critical severity explicitly stated by analyst';
                    else if (sev.includes('HIGH')) currentRisk.severityReason = 'High severity based on exposed attack surface or critical asset';
                    else if (sev.includes('MEDIUM') || sev.includes('MED')) currentRisk.severityReason = 'Medium severity - moderate exposure, limited visibility, or partial control';
                    else if (sev.includes('LOW')) currentRisk.severityReason = 'Low severity - minimal exposure, good visibility, or strong controls present';
                    else currentRisk.severityReason = 'MEDIUM severity - moderate exposure (default rating)';
                }
                if (cleanLine.match(/\*\*Evidence:\*\*/i)) {
                    currentRisk.evidence = cleanLine.replace(/\*\*/g, '').replace(/Evidence:/i, '').trim();
                }
                if (cleanLine.match(/\*\*MITRE/i)) {
                    const mitres = cleanLine.match(/T\d{4}[\.\d]*/g) || [];
                    currentRisk.mitre = mitres;
                }
                if (cleanLine.match(/\*\*Recommended Action:\*\*/i)) {
                    currentRisk.action = cleanLine.replace(/\*\*/g, '').replace(/Recommended Action:/i, '').trim();
                }
            }
            
            if (cleanLine.match(/Attack Surface| Hypotheses|Missing Visibility/i) && currentRisk) {
                threats.push(currentRisk);
                currentRisk = null;
            }
        }
        
        if (currentRisk && currentRisk.title) {
            threats.push(currentRisk);
        }
        
        if (threats.length === 0) {
            let currentThreat = null;
            for (const line of lines) {
                const cleanLine = line.replace(/^[\s\-\*\>\#]+/, '').trim();
                
                if (cleanLine.match(/Risk:/i) && !cleanLine.match(/Severity:/i)) {
                    if (currentThreat && currentThreat.title) {
                        threats.push(currentThreat);
                    }
                    const title = cleanLine.replace(/Risk:/i, '').trim();
                    currentThreat = { title: title, severity: 'medium', severityReason: 'Awaiting analyst severity assessment', evidence: '', mitre: [], action: '' };
                }
                
                if (currentThreat && cleanLine.match(/Severity:/i)) {
                    const sev = cleanLine.replace(/Severity:/i, '').trim().toUpperCase();
                    if (sev.includes('HIGH') || sev.includes('CRIT')) {
                        currentThreat.severity = 'high';
                        currentThreat.severityReason = 'HIGH severity - exposed attack surface or critical asset';
                    } else if (sev.includes('LOW')) {
                        currentThreat.severity = 'low';
                        currentThreat.severityReason = 'LOW severity - minimal exposure or good controls present';
                    } else {
                        currentThreat.severity = 'medium';
                        currentThreat.severityReason = 'MEDIUM severity - moderate exposure';
                    }
                }
                
                if (currentThreat && cleanLine.match(/Evidence:/i)) {
                    currentThreat.evidence = cleanLine.replace(/Evidence:/i, '').trim();
                }
                
                if (currentThreat && cleanLine.match(/Recommended Action:/i)) {
                    currentThreat.action = cleanLine.replace(/Recommended Action:/i, '').trim();
                }
                
                if (currentThreat && cleanLine.match(/MITRE/i)) {
                    const mitres = cleanLine.match(/T\d{4}[\.\d]*/g) || [];
                    currentThreat.mitre = mitres;
                }
                
                if (currentThreat && cleanLine.match(/^(Risk Summary|Attack Surface|Honest Assessment|What to Monitor)/i)) {
                    threats.push(currentThreat);
                    currentThreat = null;
                }
            }
            if (currentThreat && currentThreat.title) {
                threats.push(currentThreat);
            }
        }
        
        const getSeverityTooltip = (t) => {
            let factors = '';
            let why = t.severityReason || 'Rating derived from Claude analysis';
            if (t.severity === 'high') {
                factors = 'Exposed network services/ports | Critical system components | Known vulnerable software | Unusual process activity | External network exposure';
            } else if (t.severity === 'medium') {
                factors = 'Partial attack surface exposure | Some visibility gaps | Moderate network access | Limited abnormal behavior';
            } else {
                factors = 'Minimal exposure | Good visibility | Strong controls present | Normal system behavior';
            }
            return { rating: t.severity.toUpperCase(), why: why, factors: factors };
        };
        
        const getEvidenceTooltip = (t) => {
            if (!t.evidence) return null;
            return t.evidence;
        };
        
        if (threats.length > 0) {
            threatList.innerHTML = threats.slice(0, 8).map(t => {
                const severityInfo = getSeverityTooltip(t);
                const evidenceInfo = getEvidenceTooltip(t);
                return `
                <div class="threat-card" style="padding: 12px; margin-bottom: 8px; border-radius: 6px; background: ${t.severity === 'high' ? '#ffe6e6' : t.severity === 'medium' ? '#fff3e6' : '#e6f4ea'}; border: 1px solid ${t.severity === 'high' ? '#ff3b30' : t.severity === 'medium' ? '#ff9500' : '#34c759'};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${t.severity === 'high' ? '#ff3b30' : t.severity === 'medium' ? '#ff9500' : '#34c759'};"></div>
                        <span class="severity-badge" style="font-size: 10px; font-weight: 600; color: ${t.severity === 'high' ? '#ff3b30' : t.severity === 'medium' ? '#ff9500' : '#34c759'}; cursor: pointer;"
                              onmouseover="showTooltip(this, '${severityInfo.rating}', '${severityInfo.why.replace(/'/g, "\\'")}', '${severityInfo.factors.replace(/'/g, "\\'")}')"
                              onmouseout="hideTooltip()">${t.severity.toUpperCase()} SEVERITY</span>
                    </div>
                    <div style="font-weight: 600; font-size: 13px; color: #1d1d1f; margin-bottom: 6px;">${this.escapeHtml(t.title)}</div>
                    ${t.evidence ? `<div class="evidence-text" style="font-size: 11px; color: #666; margin-bottom: 4px; cursor: pointer;"
                        onmouseover="showEvidenceTooltip(this, '${t.evidence.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')"
                        onmouseout="hideTooltip()"><strong>Evidence:</strong> ${this.escapeHtml(t.evidence.substring(0, 200))}</div>` : ''}
                    ${t.action ? `<div style="font-size: 11px; color: #0071e3; margin-bottom: 4px;"><strong>Action:</strong> ${this.escapeHtml(t.action.substring(0, 150))}</div>` : ''}
                    ${t.mitre.length > 0 ? '<div style="margin-top: 6px;">' + t.mitre.slice(0, 4).map(m => `<span style="margin-right: 4px; font-size: 10px; padding: 2px 6px; background: #eaeaeb; border-radius: 4px;">${m}</span>`).join('') + '</div>' : ''}
                </div>
            `}).join('');
        } else {
            threatList.innerHTML = '<div style="color: #666; font-size: 12px; padding: 12px;">No significant risks detected. View full analysis in Agent Outputs tab.</div>';
        }
    }

    updateScenariosViz(output) {
        const tbody = document.getElementById('scenarioTable');
        const lines = output.split('\n');
        
        const priorities = [];
        const detectionRules = [];
        let currentRule = null;
        let nextSteps = [];
        const mitres = [];
        
        for (const line of lines) {
            const cleanLine = line.replace(/^[\s\-\*\>\#\|]+/, '').trim();
            
            const mitreMatch = cleanLine.match(/T\d{4}[\.\d]*/g);
            if (mitreMatch) {
                mitres.push(...mitreMatch);
            }
            
            if (cleanLine.match(/\*\*Detection Rule \d+:/i) || cleanLine.match(/^\*\*[A-Za-z ]+Rule/i)) {
                if (currentRule) detectionRules.push(currentRule);
                const name = cleanLine.replace(/\*\*/g, '').replace(/:/g, '').trim();
                currentRule = { name: name, monitor: '', condition: '' };
            }
            
            if (currentRule) {
                if (cleanLine.match(/\*\*What to monitor:\*\*/i)) {
                    currentRule.monitor = cleanLine.replace(/\*\*/g, '').replace(/What to monitor:/i, '').trim();
                }
                if (cleanLine.match(/\*\*Condition:\*\*/i)) {
                    currentRule.condition = cleanLine.replace(/\*\*/g, '').replace(/Condition:/i, '').trim();
                }
            }
            
            if (cleanLine.match(/^\d+\.\s+/)) {
                nextSteps.push(cleanLine);
            }
        }
        
        if (currentRule) detectionRules.push(currentRule);
        
        // Remove duplicates from mitres
        const uniqueMitres = [...new Set(mitres)];
        
        if (uniqueMitres.length > 0 || detectionRules.length > 0 || nextSteps.length > 0) {
            let rows = '';
            
            if (uniqueMitres.length > 0) {
                rows += `<tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px; font-weight: 600; background: #f5f5f7; color: #1d1d1f;">MITRE ATT&CK Techniques</td>
                    <td style="padding: 12px; background: #f5f5f7;">
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
                            ${uniqueMitres.slice(0, 12).map(m => `<span style="padding: 4px 10px; background: #eaeaeb; border-radius: 4px; font-size: 11px; font-weight: 600; color: #333;">${m}</span>`).join(' ')}
                        </div>
                        ${uniqueMitres.length > 12 ? `<div style="font-size: 10px; color: #666;">+ ${uniqueMitres.length - 12} more techniques</div>` : ''}
                    </td>
                </tr>`;
            }
            
            if (detectionRules.length > 0) {
                rows += `<tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px; font-weight: 600; color: #1d1d1f;">Detection Rules</td>
                    <td style="padding: 12px;">
                        <div style="font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 8px;">${detectionRules.length} Rules Generated</div>
                        ${detectionRules.slice(0, 3).map(r => `
                            <div style="padding: 8px; margin-bottom: 6px; background: #f0f9ff; border-left: 3px solid #0071e3; border-radius: 4px;">
                                <div style="font-weight: 600; font-size: 12px; color: #1d1d1f;">${this.escapeHtml(r.name || 'Detection Rule')}</div>
                                ${r.monitor ? `<div style="font-size: 10px; color: #666; margin-top: 4px;"><strong>Monitor:</strong> ${this.escapeHtml(r.monitor.substring(0, 80))}</div>` : ''}
                                ${r.condition ? `<div style="font-size: 10px; color: #666; margin-top: 2px;"><strong>Condition:</strong> ${this.escapeHtml(r.condition.substring(0, 80))}</div>` : ''}
                            </div>
                        `).join('')}
                        <div style="font-size: 11px; color: #666; margin-top: 8px;">View all ${detectionRules.length} rules in Agent Outputs tab</div>
                    </td>
                </tr>`;
            }
            
            if (nextSteps.length > 0) {
                rows += `<tr>
                    <td style="padding: 12px; font-weight: 600; color: #1d1d1f;">Recommended Actions</td>
                    <td style="padding: 12px;">
                        <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #1d1d1f;">
                            ${nextSteps.slice(0, 5).map(s => `<li style="margin: 8px 0; padding: 6px; background: #f5f5f7; border-radius: 4px;">${this.escapeHtml(s.replace(/^\d+\.\s*/, '').substring(0, 200))}</li>`).join('')}
                        </ol>
                    </td>
                </tr>`;
            }
            
            if (rows) {
                tbody.innerHTML = rows;
            } else {
                tbody.innerHTML = `<tr><td colspan="2" style="padding: 20px; text-align: center; color: #666;">View complete detection rules in Agent Outputs tab</td></tr>`;
            }
        } else {
            tbody.innerHTML = `<tr><td colspan="2" style="padding: 20px; text-align: center; color: #666;">Awaiting detection analysis...</td></tr>`;
        }
    }

    handleComplete() {
        console.log('Analysis complete. Agent outputs:', Object.keys(this.agentOutputs).map(k => `${k}: ${this.agentOutputs[k]?.length || 0} chars`));
        
        this.eventSource.close();
        this.setRunning(false);
        this.setStatus('complete', 'Complete');
        this.downloadBtn.disabled = false;
        
        this.logHeader('ANALYSIS COMPLETE', 'success');
        this.log('success', 'System', 'Security analysis finished. Review agent outputs and visualizations.');
        
        this.updateFullOutputDisplay();
        
        // Update visualizations with final complete outputs
        console.log('Updating visualizations...');
        if (this.agentOutputs.agent1) {
            console.log('Updating observations with', this.agentOutputs.agent1.length, 'chars');
            this.updateObservationsViz(this.agentOutputs.agent1);
        }
        if (this.agentOutputs.agent2) {
            console.log('Updating threats with', this.agentOutputs.agent2.length, 'chars');
            this.updateThreatsViz(this.agentOutputs.agent2);
        }
        if (this.agentOutputs.agent3) {
            console.log('Updating scenarios with', this.agentOutputs.agent3.length, 'chars');
            this.updateScenariosViz(this.agentOutputs.agent3);
        }
        
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

        document.getElementById('processTable').innerHTML = '<tr><td colspan="3" style="color: #666">Awaiting telemetry data...</td></tr>';
        document.getElementById('threatList').innerHTML = '<div style="color: #666; font-size: 12px;">Awaiting threat analysis...</div>';
        document.getElementById('scenarioTable').innerHTML = '<tr><td colspan="2" style="color: #666;">Awaiting scenario generation...</td></tr>';

        this.downloadBtn.disabled = true;
        this.agentOutputs = { agent1: '', agent2: '', agent3: '' };
        this.updateFullOutputDisplay();
    }

    download() {
        fetch('/api/download/pdf')
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Download failed'); });
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Scry_report_${new Date().toISOString().slice(0,19).replace(/[-T:]/g,'_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                this.showToast('Report downloaded successfully');
            })
            .catch(err => {
                this.showToast(err.message, 'error');
            });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast' + (type === 'error' ? ' error-toast' : '');
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
    window.copyCode = function(btn) {
        const code = btn.previousElementSibling.textContent;
        navigator.clipboard.writeText(code).then(() => {
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = 'Copy';
                btn.classList.remove('copied');
            }, 2000);
        });
    };
    
    window.showTooltip = function(elem, rating, why, factors) {
        let existing = document.getElementById('customTooltip');
        if (existing) existing.remove();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'customTooltip';
        tooltip.style.cssText = 'position: fixed; z-index: 9999; background: #1d1d1f; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 12px; max-width: 320px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); border: 1px solid #333; pointer-events: none;';
        tooltip.innerHTML = `
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: ${rating === 'HIGH' ? '#ff3b30' : rating === 'MEDIUM' ? '#ff9500' : '#34c759'};">SEVERITY: ${rating}</div>
            <div style="margin-bottom: 10px; line-height: 1.5;"><strong>Why:</strong> ${why}</div>
            <div style="line-height: 1.6;"><strong>Factors considered:</strong><br/>${factors.replace(/\|/g, '<br/>')}</div>
        `;
        
        const rect = elem.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 8) + 'px';
        
        document.body.appendChild(tooltip);
    };
    
    window.hideTooltip = function() {
        const existing = document.getElementById('customTooltip');
        if (existing) existing.remove();
    };
    
    window.showEvidenceTooltip = function(elem, evidence) {
        let existing = document.getElementById('customTooltip');
        if (existing) existing.remove();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'customTooltip';
        tooltip.style.cssText = 'position: fixed; z-index: 9999; background: #1d1d1f; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 12px; max-width: 350px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); border: 1px solid #333; pointer-events: none;';
        tooltip.innerHTML = `
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #00ccff;">EVIDENCE FROM TELEMETRY</div>
            <div style="line-height: 1.5; color: #ddd;">${evidence.replace(/\n/g, '<br/>')}</div>
            <div style="margin-top: 8px; font-size: 10px; color: #888;">Source: System telemetry collection</div>
        `;
        
        const rect = elem.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 8) + 'px';
        
        document.body.appendChild(tooltip);
    };
});

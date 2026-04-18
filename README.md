# Scry - AI-Powered Windows Telemetry & Threat Intelligence Platform

An AI-powered security analysis platform that transforms raw Windows telemetry into actionable threat intelligence.

Most security tools overwhelm you with raw data and leave the analysis to you. This platform takes a different approach - it collects your system's real-time metrics and uses specialized AI agents to surface what actually matters. CPU spikes, unusual network connections, suspicious processes - the platform analyzes all of it and tells you what's worth your attention.

The platform uses four AI agents that work together: one extracts meaningful observations from raw telemetry, another maps those observations to potential threats, a third generates defensive scenarios based on real findings, and the fourth creates a final executive summary. Each agent builds on the last, creating a complete picture from scattered metrics.

Threats are automatically mapped to the MITRE ATT&CK framework, so you see not just what's abnormal, but how it fits into known attack patterns. Reports export to PDF for documentation or sharing. The entire analysis pipeline is visible - you see every command run, every AI decision made, every finding surfaced.

---

## Key Features

**Real-Time System Telemetry:**
Scry continuously monitors your Windows machine, collecting CPU usage, memory allocation, disk utilization, network connections, and running processes. Every data point is traceable to its source system call, giving you confidence that what you see is what's actually happening.

**AI-Powered Threat Analysis:**
Three specialized agents work together to analyze your telemetry. The Observation Agent extracts factual findings from raw data. The Threat Agent maps attack surface and potential risks. The Detection Engineering Agent generates actionable detection rules and hunting queries. Each agent builds on the previous one, creating a complete picture from raw numbers.

**MITRE ATT&CK Framework Integration:**
Threats don't exist in a vacuum - Scry automatically maps detected patterns to the industry-standard MITRE ATT&CK framework. You see not just what might be wrong, but how it fits into known attack patterns, from initial access through data exfiltration.

**Transparent Analysis Pipeline:**
Every AI decision is visible. Watch your telemetry flow through each agent, see the exact prompts sent to the AI, observe the reasoning as it happens. When Scry flags a concern, you can trace exactly why - back to the specific metric, the specific pattern, the specific technique that triggered it.

**Professional PDF Reports:**
Generate comprehensive security reports with one click. Include system snapshots, threat analysis, MITRE ATT&CK mappings, and recommended detection rules. Perfect for compliance documentation, incident response records, or sharing findings with your security team.
*View a sample report here: [Sample Analysis Report](docs/analysis_report.md)*

**Live Streaming Dashboard:**
Watch analysis unfold in real-time. Telemetry collection appears command-by-command. AI agents share their thinking as they analyze. Visualizations update as patterns emerge. You don't wait for results - you watch them being created.

---

## System Architecture

<h3 align="center">System Architecture Diagram</h3>

<figure>
  <p align="center">
    <img src="https://i.imgur.com/rVaibks.png" alt="System Architecture Diagram" width="850"/>
  </p>
  <figcaption><p align="center"><b>Figure 1:</b> System Architecture of Scry workflow</p></figcaption>
</figure>

### Architecture Explanation

The system follows a sequential data pipeline that starts with extracting raw system metrics, processes them into structured telemetry, analyzes the findings using an AI agent chain, and presents the actionable intelligence on an interactive dashboard.

**1. Windows System**

The process originates at the operating system level, capturing critical data points via OS APIs. The fundamental metrics extracted include CPU utilization, Memory allocation, Disk usage, Network activities, and detailed information about running Processes. This provides the foundational state of the target system.

**2. LoggingCollector (psutil)**

A specialized Python module, leveraging the `psutil` cross-platform library, serves as the primary data collection mechanism. It executes specific functions such as `cpu_percent()`, `virtual_memory()`, `disk_usage()`, `net_connections()`, and `process_iter()`. This layer is responsible for periodically sampling the system's runtime state to gather raw operational data securely and efficiently.

**3. Telemetry**

The raw measurements collected by the `LoggingCollector` are aggregated and structured into a standardized JSON payload. Each data point is annotated with precise timestamps and output logs. This telemetry payload, combined with engineered system prompts, forms the necessary input to feed into the AI analytical layer.

**4. Agent Chain**

The structured telemetry is processed by a sequential pipeline consisting of four specialized AI models:
- **Agent 1 - Observation Agent**: This agent ingests the raw telemetry JSON and distills factual, unbiased security findings from the data.
- **Agent 2 - Threat Agent**: Operating on the findings of Agent 1, it maps potential vulnerabilities, identifies exposed attack surfaces, and correlates data with known risks.
- **Agent 3 - Detection Engineering Agent**: Taking the threat profile from Agent 2, this final agent creates concrete, actionable defense scenarios, generating detection rules and SIEM hunting queries tailored to the observed environment.
- **Agent 4 - Summary Agent**: Synthesizes the outputs of the previous three agents into a high-level Executive Summary, comprehensive Conclusion, and Chart Analysis, making the data highly digestible for Security Engineers in the final report.

**5. Web Dashboard**

The culminating point of the architecture is the interactive Web Dashboard. Using Server-Sent Events (SSE), it streams the telemetry collection process, live command execution logs, and the continuous output from each phase of the AI Agent Chain. This allows users to monitor the complete analytical process in real-time, visualizing both raw metrics and the generated threat intelligence.

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Python 3.10+ | Core logic and processing |
| Web Server | Flask | HTTP API and SSE streaming |
| Telemetry | psutil | System metrics collection |
| AI Provider | Anthropic Claude (`claude-sonnet-4-20250514`) | Language model analysis |
| Frontend | Vanilla JS | Dashboard interface |
| Styling | CSS (Apple Design) | Modern UI |
| PDF | ReportLab | Report generation |

---

## Setup Instructions

### Prerequisites
- Windows 10/11
- Python 3.10 or higher
- Internet connection (for AI analysis)

### Step 1: Clone the Repository
```bash
git clone https://github.com/ritvikindupuri/Cipher-security.git
cd Cipher-security
```

### Step 2: Create Virtual Environment
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Get Your Anthropic API Key

Scry uses Anthropic's Claude AI for security analysis. Here's how to get your API key:

**4.1 Create an Anthropic Account**
1. Go to https://console.anthropic.com
2. Click "Sign Up" 
3. You can sign up with Google, or email/password
4. Verify your email if required

**4.2 Access the API Keys Section**
1. After logging in, go to https://console.anthropic.com/keys
2. Click "Create Key"

**4.3 Create Your API Key**
1. Enter a name for your key (e.g., "Scry Security Analysis")
2. Select appropriate permissions (default is fine)
3. Click "Create"
4. **Important:** Copy the API key immediately - it will only be shown once
5. The key starts with `sk-ant-api03-`

**4.4 Understand the Available Models**

Scry supports Claude models:

| Model | Model ID | Cost | Best For |
|-------|----------|------|----------|
| Claude Sonnet | `claude-sonnet-4-20250514` | $3/M input, $15/M output | **Recommended** - Fast, balanced |
| Claude Opus | `claude-opus-4-20250514` | $15/M input, $75/M output | Best reasoning, higher cost |

### Step 5: Configure Environment

Create a `.env` file in the project root with your Anthropic configuration:

```bash
# Enable Anthropic API (required)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Model selection (Sonnet is recommended)
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Example:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-bsJI6bbC1nzPJMkCPKuo...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

**How the App Uses These Variables:**
- `ANTHROPIC_API_KEY` authenticates your requests to Anthropic's servers
- `ANTHROPIC_MODEL` specifies which Claude model to use for all three agents

### Step 6: Run the Dashboard
```bash
python app.py
```

### Step 7: Open in Browser
Navigate to http://127.0.0.1:5000

### Step 8: Execute Analysis
1. Click **"Execute Analysis"**
2. Watch telemetry collection in the **Command Log** tab
3. Switch to **Visualizations** to see live charts
4. Switch to **Agent Outputs** to see full Claude analysis
5. Download PDF report when complete

---

## Understanding the Analysis

### What Each Agent Does

**Observation Agent** analyzes raw system telemetry:
- CPU, memory, disk usage metrics
- Running processes and their resource usage
- Network connections and listening ports
- System overview and health status

**Threat Agent** maps the attack surface:
- Identifies exposed services and listening ports
- Analyzes network connections (internal vs external)
- Assesses process risks and network-accessible processes
- Provides honest assessment of what CAN vs CANNOT be determined

**Detection Engineering Agent** generates actionable detection rules:
- Ranks MITRE ATT&CK techniques by relevance to this system
- Provides concrete detection rules with log sources and conditions
- Generates SIEM/hunting queries ready to use
- Lists indicators to watch (files, network, processes)
- Recommends prioritized next steps for the security team

### MITRE ATT&CK Framework

The app maps security observations to MITRE ATT&CK tactics:
| Tactic | Description |
|--------|-------------|
| TA0001 - Initial Access | How an attacker might gain entry |
| TA0002 - Execution | How malicious code might run |
| TA0003 - Persistence | How an attacker might maintain access |
| TA0004 - Privilege Escalation | How an attacker might gain elevated access |
| TA0005 - Defense Evasion | How an attacker might avoid detection |
| TA0011 - Command & Control | How an attacker might communicate with systems |
| TA0010 - Exfiltration | How an attacker might steal data |

---

## Agent Design Principles

Each agent is designed for accuracy and honesty:

### Agent 1: Observation Agent
- References actual JSON paths from the telemetry schema
- Only describes what exists in the data
- Never speculates beyond the observed metrics

### Agent 2: Threat Agent
- Explicitly states what CAN vs CANNOT be determined from data
- Won't fabricate threats that don't exist in the observations
- Provides honest assessment of observable attack surface only

### Agent 3: Detection Engineering Agent
- Generates actual detection rules based on identified risks
- Creates SIEM/hunting queries from real telemetry
- Provides indicators and next steps grounded in actual observations

### Agent 4: Summary Agent
- Consolidates the outputs into a focused narrative for Security Engineers
- Extracts the signal from the noise
- Ties technical findings to security posture recommendations

The app is designed to be a **security analyst tool**, not a threat generator. It tells you what it sees, what risks are observable, and how to detect them - nothing more.

---

## Troubleshooting

**Agent gets stuck on "Running..."**
- Check your Anthropic API key is valid
- Ensure you have credits in your Anthropic account at console.anthropic.com
- Claude API may be rate-limited during high traffic

**No data in visualizations**
- Make sure you're running on Windows
- Check telemetry collection completed successfully in Command Log

**API Errors**
- Verify your `ANTHROPIC_API_KEY` is correct
- Check you have sufficient credits at console.anthropic.com
- Try a different model if the current one is unavailable

---

## License

MIT License

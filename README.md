# Scry

An AI-powered security analysis platform that transforms raw Windows telemetry into actionable threat intelligence.

Most security tools overwhelm you with raw data and leave the analysis to you. This platform takes a different approach - it collects your system's real-time metrics and uses specialized AI agents to surface what actually matters. CPU spikes, unusual network connections, suspicious processes - the platform analyzes all of it and tells you what's worth your attention.

The platform uses three AI agents that work together: one extracts meaningful observations from raw telemetry, another maps those observations to potential threats, and a third generates defensive scenarios based on real findings. Each agent builds on the last, creating a complete picture from scattered metrics.

Threats are automatically mapped to the MITRE ATT&CK framework, so you see not just what's abnormal, but how it fits into known attack patterns. Reports export to PDF for documentation or sharing. The entire analysis pipeline is visible - you see every command run, every AI decision made, every finding surfaced.

---

## Key Features

**Real-Time System Telemetry**
Scry continuously monitors your Windows machine, collecting CPU usage, memory allocation, disk utilization, network connections, and running processes. Every data point is traceable to its source system call, giving you confidence that what you see is what's actually happening.

**AI-Powered Threat Analysis**
Three specialized agents work together to analyze your telemetry. The Observation Agent extracts factual findings from raw data. The Threat Agent maps these findings to potential attack vectors and vulnerabilities. The Scenario Agent synthesizes everything into actionable defensive strategies. Each agent builds on the previous one, creating a complete picture from raw numbers.

**MITRE ATT&CK Framework Integration**
Threats don't exist in a vacuum - Scry automatically maps detected patterns to the industry-standard MITRE ATT&CK framework. You see not just what might be wrong, but how it fits into known attack patterns, from initial access through data exfiltration.

**Transparent Analysis Pipeline**
Every AI decision is visible. Watch your telemetry flow through each agent, see the exact prompts sent to the AI, observe the reasoning as it happens. When Scry flags a concern, you can trace exactly why - back to the specific metric, the specific pattern, the specific technique that triggered it.

**Professional PDF Reports**
Generate comprehensive security reports with one click. Include system snapshots, threat analysis, MITRE ATT&CK mappings, and recommended detection rules. Perfect for compliance documentation, incident response records, or sharing findings with your security team.

**Live Streaming Dashboard**
Watch analysis unfold in real-time. Telemetry collection appears command-by-command. AI agents share their thinking as they analyze. Visualizations update as patterns emerge. You don't wait for results - you watch them being created.

---

## System Architecture

<figure>
<p align="center">
  <img src="docs/architecture.png" alt="System Architecture Diagram" width="850"/>
</p>
<figcaption align="center"><b>Figure 1:</b> System Architecture</figcaption>
</figure>

The system consists of four layers that work sequentially to collect, process, analyze, and report on system telemetry.

**Layer 1: Data Collection**

The LoggingCollector module uses psutil to execute system calls for cpu_percent, process_iter, net_connections, disk_usage, and virtual_memory. Each command is logged with its timestamp, raw output, execution duration, and success status. Events stream to the dashboard via Server-Sent Events.

**Layer 2: AI Processing**

The Agent Chain sends telemetry to three DeepSeek LLM instances via OpenRouter. Agent 1 (Observations) extracts factual observations from raw data. Agent 2 (Threats) maps attack surface from Agent 1 output plus original telemetry. Agent 3 (Scenarios) generates defensive scenarios from both prior outputs with MITRE ATT&CK mapping. All responses stream token-by-token to the dashboard.

**Layer 3: Dashboard Display**

Flask hosts the web interface and API endpoints. The Command Log tab displays system commands and raw outputs in terminal format. The Visualizations tab shows charts and data tables. The Agent Outputs tab shows full DeepSeek AI analysis.

**Layer 4: Report Generation**

ReportLab generates professional PDF reports containing system overview, telemetry summary, threat analysis, MITRE ATT&CK scenarios, and all agent outputs. Reports download after analysis completes.

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Python 3.10+ | Core logic and processing |
| Web Server | Flask | HTTP API and SSE streaming |
| Telemetry | psutil | System metrics collection |
| AI Provider | DeepSeek API | Language model analysis |
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

### Step 4: Get Your DeepSeek API Key

Scry uses DeepSeek's official API for AI analysis. Here's how to get your API key:

**4.1 Create a DeepSeek Account**
1. Go to https://platform.deepseek.com
2. Click "Sign Up" in the top-right corner
3. You can sign up with Google, GitHub, or email/password
4. Verify your email if required

**4.2 Access the API Keys Section**
1. After logging in, go to https://platform.deepseek.com/api_keys
2. Or click on your profile icon and select "API Keys"

**4.3 Create Your API Key**
1. Click the "Create API Key" button
2. Enter a name for your key (e.g., "Scry Security Analysis")
3. Click "Create"
4. **Important:** Copy the API key immediately - it will only be shown once
5. The key starts with `sk-` (e.g., `sk-58c247c59f8c43c49c92ec00b8e852ea`)

**4.4 Add Credits to Your Account**
1. Go to https://platform.deepseek.com/credits
2. Click "Add credits"
3. Choose an amount - DeepSeek is very affordable:
   - DeepSeek Chat (deepseek-chat): ~$0.001 per 1K tokens
   - DeepSeek Reasoner (deepseek-reasoner): ~$0.001 per 1K tokens
   - **$1-2 credits typically covers hundreds of analyses**
4. Complete the payment

**4.5 Understand the Model Options**

The app uses DeepSeek's chat model. Available models:

| Model | Model ID | Cost | Best For |
|-------|----------|------|----------|
| DeepSeek Chat | `deepseek-chat` | ~$0.50/1M tokens | **Recommended** - Fast, balanced |
| DeepSeek Reasoner | `deepseek-reasoner` | ~$0.50/1M tokens | Better reasoning, slower |

### Step 5: Configure Environment

Create a `.env` file in the project root with your DeepSeek configuration:

```bash
# Enable DeepSeek API (required)
USE_DEEPSEEK=1

# Your DeepSeek API key (paste your key here)
DEEPSEEK_API_KEY=sk-your-key-here

# Model selection (deepseek-chat is recommended)
DEEPSEEK_MODEL=deepseek-chat
```

Example with a real key:
```bash
USE_DEEPSEEK=1
DEEPSEEK_API_KEY=sk-58c247c59f8c43c49c92ec00b8e852ea
DEEPSEEK_MODEL=deepseek-chat
```

**How the App Uses These Variables:**
- `USE_DEEPSEEK=1` tells the app to use DeepSeek's API
- `DEEPSEEK_API_KEY` authenticates your requests to DeepSeek's servers
- `DEEPSEEK_MODEL` specifies which DeepSeek model to use for all three agents

**Alternative: Using OpenRouter**
If you prefer OpenRouter instead, you can use:
```bash
USE_OPENROUTER=1
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=deepseek/deepseek-chat-v3
```

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
4. Switch to **Agent Outputs** to see full DeepSeek analysis
5. Download PDF report when complete

---

## Understanding the Analysis

### What Each Agent Does

**Observation Agent** analyzes raw system telemetry:
- CPU, memory, disk usage metrics
- Running processes and their resource usage
- Network connections and listening ports
- Potential anomalies in system state

**Threat Agent** maps the attack surface:
- Identifies processes with network access
- Flags unusual network connections
- Maps observations to potential attack vectors
- Uses MITRE ATT&CK framework for classification

**Scenario Agent** generates defensive scenarios:
- Creates hypothetical attack chains based on observations
- Maps each phase to MITRE tactics and techniques
- Provides detection signals for each phase
- Suggests investigation and mitigation steps

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

## Troubleshooting

**Agent gets stuck on "Running..."**
- Check your DeepSeek API key is valid
- Ensure you have credits in your DeepSeek account at platform.deepseek.com/credits
- DeepSeek API may be rate-limited during high traffic

**No data in visualizations**
- Make sure you're running on Windows
- Check telemetry collection completed successfully in Command Log

**API Errors**
- Verify your `DEEPSEEK_API_KEY` is correct
- Check you have sufficient credits at platform.deepseek.com/credits
- Try a different model if the current one is unavailable

---

## License

MIT License

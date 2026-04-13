# Cipher

**Real Security Intelligence** - A transparent AI-powered security analysis platform that combines live Windows telemetry with multi-agent AI analysis.

Cipher decrypts your system's security posture by collecting real-time metrics from your Windows machine and processing them through specialized AI agents. Every insight is traceable to source data, every AI decision is explainable, and every command execution is visible. This is not a simulated demo - it is a working security analysis tool built for transparency.

---

## Key Features

**100% Real Data** - No simulation. Every metric comes directly from your Windows system via native APIs including CPU usage, memory allocation, disk utilization, network connections, and process inventory.

**Transparent AI** - Watch the AI think in real-time. See the exact prompts sent to each agent, view raw system command outputs, and follow the reasoning chain step-by-step as DeepSeek generates its analysis.

**Multi-Agent Pipeline** - Three specialized DeepSeek AI agents analyze your system from different security angles. The Telemetry Analyst extracts facts from raw data, the Attack Surface Mapper identifies potential vulnerabilities, and the Tabletop Scenario Author creates defensive training scenarios.

**Live Dashboard** - Modern web interface showing real-time command execution, AI thinking as it happens, system metrics visualization, and PDF report generation.

---

## System Architecture

The system consists of four main layers that work together to collect, process, and analyze system telemetry.

**Layer 1: Data Collection**

- The LoggingCollector module uses psutil to make direct system calls
- Commands executed include psutil.cpu_percent(), psutil.process_iter(), psutil.net_connections(), psutil.disk_usage(), and psutil.virtual_memory()
- Every command is logged with timestamp, output, duration, and status
- Events are emitted via Server-Sent Events to the dashboard

**Layer 2: AI Processing**

- Telemetry JSON is combined with system prompts and sent to DeepSeek LLM via OpenRouter API
- Agent 1 receives the raw telemetry and extracts factual observations
- Agent 2 receives Agent 1 output plus original telemetry and maps attack surface
- Agent 3 receives Agent 1 and Agent 2 output and generates defensive scenarios
- All responses stream token-by-token back to the dashboard

**Layer 3: Dashboard Display**

- Flask server hosts the web interface and handles API requests
- Command Log tab shows system commands with timestamps and raw outputs
- Agent Outputs tab shows real-time AI reasoning
- Progress indicators track execution through each phase

**Layer 4: Report Generation**

- ReportLab generates professional PDF reports
- Reports include system overview, telemetry summary, and all agent outputs
- Reports are downloadable after analysis completion

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Python 3.10+ | Core logic and data processing |
| Web Server | Flask | HTTP API and SSE streaming |
| Telemetry | psutil | Cross-platform system metrics |
| AI Provider | OpenRouter + DeepSeek LLM | Language model for analysis |
| Frontend | Vanilla JS | Zero-dependency dashboard |
| Styling | CSS (Apple Design) | Modern, clean UI |
| PDF Generation | ReportLab | Server-side report creation |

---

## Setup Instructions

### Prerequisites

- Operating System: Windows 10/11 (required for telemetry collection)
- Python: 3.10 or higher
- OpenRouter API Key: Free at openrouter.ai

### Step 1: Clone the Repository

Open a terminal and clone the Cipher repository:

```
git clone https://github.com/ritvikindupuri/Cipher-security.git
cd Cipher-security
```

### Step 2: Create Virtual Environment

Create and activate a Python virtual environment:

```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies

Install all required Python packages:

```
pip install -r requirements.txt
```

### Step 4: Configure Environment

Create a .env file in the project root with your OpenRouter API key:

```
USE_OPENROUTER=1
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=deepseek/deepseek-chat-v3
```

To get an OpenRouter API key:

- Visit openrouter.ai
- Sign up or sign in to your account
- Navigate to Keys and create a new key
- Copy the key (starts with sk-or-)

### Step 5: Run the Dashboard

Start the Flask development server:

```
python app.py
```

### Step 6: Open in Browser

Navigate to http://127.0.0.1:5000 in your web browser.

### Step 7: Execute Analysis

- Click the Execute Analysis button to begin
- Monitor the Command Log tab for real-time system data collection
- Switch to the Agent Outputs tab to see AI analysis as it happens
- Download the PDF report when analysis completes

---

## Project Structure

```
Cipher/
|-- app.py                      Flask web server and API endpoints
|-- main.py                     CLI entry point (optional)
|-- requirements.txt             Python dependencies
|-- .env                        API keys (create from .env.example)
|-- .env.example               Environment template
|-- collectors/
|   |-- __init__.py
|   |-- windows_metrics.py      Original telemetry collector
|   |-- enhanced_metrics.py     Logging telemetry collector
|-- agents/
|   |-- chain.py                Multi-agent orchestration with DeepSeek
|   |-- prompts/
|       |-- agent1_facts.txt   Telemetry Analyst prompt
|       |-- agent2_attack_surface.txt  Attack Mapper prompt
|       |-- agent3_scenario.txt        Scenario Author prompt
|-- templates/
|   |-- index.html              Dashboard HTML
|-- static/
|   |-- css/
|   |   |-- cybersecurity.css   Apple-style UI
|   |-- js/
|       |-- cipher.js          Dashboard logic
|-- README.md                   This file
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| / | GET | Dashboard web interface |
| /api/status | GET | Current analysis status |
| /api/execute | POST | Start new analysis |
| /api/stream | GET | SSE stream of events |
| /api/telemetry | GET | Raw telemetry JSON |
| /api/commands | GET | Command execution log |
| /api/prompts | GET | System prompts used |
| /api/agents | GET | Agent outputs |
| /api/report | GET | Full analysis report |
| /api/download/pdf | GET | Download PDF report |

---

## Security Notes

- No Exploits: Cipher only reads system data, never executes attacks
- Privacy: Telemetry stays local; only prompts sent to DeepSeek via OpenRouter
- Transparency: Every AI decision can be traced to source data
- Audit Trail: All commands and outputs are logged

---

## For AI Security Engineers

This project demonstrates key competencies for AI security engineering roles:

- Prompt Engineering: Multi-agent orchestration with safety constraints and grounded outputs
- AI Safety: DeepSeek outputs are constrained to observed data, preventing hallucination
- Threat Modeling: MITRE ATT&CK aligned analysis through specialized agents
- Detection Engineering: Defensive scenario generation for security training
- Real-time Systems: Live streaming dashboards using Server-Sent Events

---

## License

MIT License - Free for educational and professional use.

# Cipher

**Real Security Intelligence** - A transparent AI-powered security analysis platform that combines live Windows telemetry with multi-agent DeepSeek AI analysis.

Cipher decrypts your system's security posture by collecting real-time metrics from your Windows machine and processing them through specialized AI agents. Every insight is traceable to source data, every AI decision is explainable, and every command execution is visible.

---

## Key Features

**100% Real Data** - Every metric comes directly from your Windows system via native APIs including CPU, memory, disk, network, and processes.

**Transparent AI** - Watch the AI think in real-time. See exact prompts, raw command outputs, and DeepSeek reasoning as it happens.

**Multi-Agent Pipeline** - Three specialized DeepSeek agents: Telemetry Analyst, Attack Surface Mapper, and Tabletop Scenario Author.

**Live Dashboard** - Modern web interface with real-time command logging, AI output streaming, and PDF report generation.

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

The Agent Chain sends telemetry to three DeepSeek LLM instances via OpenRouter. Agent 1 extracts factual observations from raw data. Agent 2 maps attack surface from Agent 1 output plus original telemetry. Agent 3 generates defensive scenarios from both prior outputs. All responses stream token-by-token to the dashboard.

**Layer 3: Dashboard Display**

Flask hosts the web interface and API endpoints. The Command Log tab displays system commands and raw outputs in terminal format. The Agent Outputs tab shows real-time AI reasoning. Progress indicators track execution through each phase.

**Layer 4: Report Generation**

ReportLab generates professional PDF reports containing system overview, telemetry summary, and all agent outputs. Reports download after analysis completes.

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Python 3.10+ | Core logic and processing |
| Web Server | Flask | HTTP API and SSE streaming |
| Telemetry | psutil | System metrics collection |
| AI Provider | OpenRouter + DeepSeek | Language model analysis |
| Frontend | Vanilla JS | Dashboard interface |
| Styling | CSS (Apple Design) | Modern UI |
| PDF | ReportLab | Report generation |

---

## Setup Instructions

### Prerequisites
- Windows 10/11
- Python 3.10+
- OpenRouter API key (free at openrouter.ai)

### Step 1: Clone the Repository
```
git clone https://github.com/ritvikindupuri/Cipher-security.git
cd Cipher-security
```

### Step 2: Create Virtual Environment
```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 3: Install Dependencies
```
pip install -r requirements.txt
```

### Step 4: Configure Environment
Create a .env file with your OpenRouter API key:
```
USE_OPENROUTER=1
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=deepseek/deepseek-chat-v3
```

### Step 5: Run the Dashboard
```
python app.py
```

### Step 6: Open in Browser
Navigate to http://127.0.0.1:5000

### Step 7: Execute Analysis
Click Execute Analysis and monitor the Command Log and Agent Outputs tabs.

---

## License

MIT License

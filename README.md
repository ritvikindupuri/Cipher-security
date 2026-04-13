# Cipher

**Real Security Intelligence** - A transparent AI-powered security analysis platform that combines live Windows telemetry with multi-agent DeepSeek AI analysis.

Cipher decrypts your system's security posture by collecting real-time metrics from your Windows machine and processing them through specialized AI agents. Every insight is traceable to source data, every AI decision is explainable, and every command execution is visible. This is not a simulated demo - it is a working security analysis tool built for transparency.

---

## Key Features

**100% Real Data** - No simulation. Every metric comes directly from your Windows system via native APIs including CPU usage, memory allocation, disk utilization, network connections, and process inventory.

**Transparent AI** - Watch the AI think in real-time. See the exact prompts sent to each agent, view raw system command outputs, and follow the reasoning chain step-by-step as DeepSeek generates its analysis.

**Multi-Agent Pipeline** - Three specialized DeepSeek AI agents analyze your system from different security angles. The Telemetry Analyst extracts facts from raw data, the Attack Surface Mapper identifies potential vulnerabilities, and the Tabletop Scenario Author creates defensive training scenarios.

**Live Dashboard** - Modern web interface showing real-time command execution, AI thinking as it happens, system metrics visualization, and PDF report generation.

---

## System Architecture

**Figure 1: Cipher System Architecture**

<figure>
<p align="center">
  <img src="docs/architecture.png" alt="Cipher Architecture Diagram" width="850"/>
</p>
<figcaption align="center"><b>Figure 1:</b> System Architecture</figcaption>
</figure>

The system architecture consists of four interconnected layers that work together to collect, process, analyze, and visualize system telemetry.

**Layer 1: Data Collection (Collectors)**

The LoggingCollector module serves as the foundation of the system. It uses psutil to make direct system calls including psutil.cpu_percent() for processor utilization, psutil.process_iter() for active process enumeration, psutil.net_connections() for network socket inspection, psutil.disk_usage() for storage analysis, and psutil.virtual_memory() for memory pressure assessment. Every command executed by the collector is logged with timestamp, raw output, execution duration, and success status. Events are emitted via Server-Sent Events to the dashboard in real-time.

**Layer 2: AI Processing (Agents)**

The Agent Chain orchestrates three specialized DeepSeek LLM instances through OpenRouter. Agent 1 receives the raw telemetry JSON and extracts factual observations without inference. Agent 2 receives Agent 1 output combined with original telemetry and performs attack surface mapping. Agent 3 receives both prior agent outputs and generates defensive tabletop scenarios. All responses stream token-by-token back to the dashboard for real-time visibility into the AI reasoning process.

**Layer 3: Dashboard Display (Frontend)**

The Flask server hosts the web interface and manages API requests. The Command Log tab displays system commands with timestamps and raw outputs in a terminal-style format. The Agent Outputs tab provides real-time streaming of AI reasoning as each agent generates its analysis. Progress indicators throughout the interface track execution status through each phase of the analysis pipeline.

**Layer 4: Report Generation (Output)**

ReportLab generates professional PDF reports containing the system overview, telemetry summary, and all agent outputs. Reports are downloadable after analysis completion and serve as artifacts for documentation and further review.

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

## License

MIT License - Free for educational and professional use.

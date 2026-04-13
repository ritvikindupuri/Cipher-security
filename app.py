"""
Sentinel - Real Security Intelligence Dashboard
"""

from flask import Flask, render_template, Response, request, jsonify, send_file
from flask_cors import CORS
import json
import os
import threading
import queue
import time
from datetime import datetime
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import io

app = Flask(__name__)
CORS(app)

PROGRESS_QUEUE = queue.Queue()
SESSION_DATA = {
    "telemetry": None,
    "command_logs": [],
    "prompts": {},
    "agent_outputs": {"agent1": "", "agent2": "", "agent3": ""},
    "model": None,
    "status": "idle"
}
IS_RUNNING = False


def run_analysis():
    """Main analysis pipeline with full logging"""
    global IS_RUNNING, SESSION_DATA
    
    def emit_event(event_type: str, data: dict):
        PROGRESS_QUEUE.put({"type": event_type, **data, "timestamp": datetime.now().isoformat()})
    
    try:
        from dotenv import load_dotenv
        from agents.chain import run_claude_chain
        
        load_dotenv()
        IS_RUNNING = True
        SESSION_DATA = {
            "telemetry": None,
            "command_logs": [],
            "prompts": {},
            "agent_outputs": {"agent1": "", "agent2": "", "agent3": ""},
            "model": None,
            "status": "running"
        }
        
        # Step 1: Telemetry Collection
        emit_event("phase", {"phase": "telemetry", "status": "starting", "message": "Initializing telemetry collector..."})
        
        from collectors.enhanced_metrics import LoggingCollector
        
        def on_command(cmd_log):
            SESSION_DATA["command_logs"].append(cmd_log)
            emit_event("command", {
                "command": cmd_log.command,
                "category": cmd_log.category,
                "description": cmd_log.description,
                "status": cmd_log.status,
                "output": cmd_log.output[:500] if cmd_log.output else "",
                "error": cmd_log.error[:500] if cmd_log.error else "",
                "duration_ms": cmd_log.duration_ms
            })
        
        collector = LoggingCollector(on_command_update=on_command)
        
        emit_event("phase", {"phase": "telemetry", "status": "running", "message": "Collecting system metrics..."})
        
        snapshot = collector.collect_full_telemetry()
        session_summary = collector.get_session_summary()
        
        SESSION_DATA["telemetry"] = snapshot
        SESSION_DATA["command_logs"] = session_summary["commands"]
        
        emit_event("phase", {"phase": "telemetry", "status": "complete", 
            "message": f"Telemetry collected! {session_summary['successful_commands']} commands executed successfully"})
        
        # Step 2-4: Agent Chain
        model = os.environ.get("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3")
        SESSION_DATA["model"] = model
        
        last_agent = "agent1"
        
        def on_agent_chunk(agent_id: str, chunk: str):
            nonlocal last_agent
            if agent_id != last_agent:
                last_agent = agent_id
                if agent_id == "agent2":
                    emit_event("phase", {"phase": "agent2", "status": "starting", "message": "Threats agent analyzing attack surface..."})
                elif agent_id == "agent3":
                    emit_event("phase", {"phase": "agent3", "status": "starting", "message": "Scenarios agent generating MITRE scenarios..."})
            SESSION_DATA["agent_outputs"][agent_id] += chunk
            emit_event("agent_chunk", {
                "agent": agent_id,
                "chunk": chunk,
                "full_output": SESSION_DATA["agent_outputs"][agent_id]
            })
        
        # Load actual prompts from files
        prompts_dir = Path(__file__).parent / "agents" / "prompts"
        prompts = {
            "agent1": (prompts_dir / "agent1_facts.txt").read_text(encoding="utf-8").strip(),
            "agent2": (prompts_dir / "agent2_attack_surface.txt").read_text(encoding="utf-8").strip(),
            "agent3": (prompts_dir / "agent3_scenario.txt").read_text(encoding="utf-8").strip(),
        }
        SESSION_DATA["prompts"] = prompts
        
        # Emit each prompt to the command log
        emit_event("prompt", {
            "agent": "agent1",
            "name": "Observations",
            "prompt": prompts["agent1"]
        })
        emit_event("prompt", {
            "agent": "agent2", 
            "name": "Threats",
            "prompt": prompts["agent2"]
        })
        emit_event("prompt", {
            "agent": "agent3",
            "name": "Scenarios",
            "prompt": prompts["agent3"]
        })
        
        # Run the agent chain
        emit_event("phase", {"phase": "agent1", "status": "starting", "message": "Agent 1 analyzing telemetry..."})
        
        result = run_claude_chain(
            snapshot, 
            stream=True,
            on_agent_chunk=on_agent_chunk
        )
        
        SESSION_DATA["agent_outputs"]["agent1"] = result.agent1_facts
        SESSION_DATA["agent_outputs"]["agent2"] = result.agent2_mapping
        SESSION_DATA["agent_outputs"]["agent3"] = result.agent3_scenario
        SESSION_DATA["model"] = result.model
        SESSION_DATA["status"] = "complete"
        
        emit_event("phase", {"phase": "complete", "status": "complete", 
            "message": f"Analysis complete! Model: {result.model}"})
        
        IS_RUNNING = False
        
    except Exception as e:
        import traceback
        emit_event("error", {"message": str(e), "trace": traceback.format_exc()})
        IS_RUNNING = False
        SESSION_DATA["status"] = "error"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status")
def status():
    return jsonify({
        "running": IS_RUNNING,
        "status": SESSION_DATA.get("status", "idle"),
        "has_data": SESSION_DATA.get("telemetry") is not None
    })


@app.route("/api/execute", methods=["POST"])
def execute():
    global IS_RUNNING
    
    if IS_RUNNING:
        return jsonify({"error": "Analysis already running"}), 400
    
    PROGRESS_QUEUE.queue.clear()
    
    thread = threading.Thread(target=run_analysis)
    thread.daemon = True
    thread.start()
    
    return jsonify({"message": "Analysis started"})


@app.route("/api/stream")
def stream():
    def generate():
        while True:
            try:
                item = PROGRESS_QUEUE.get(timeout=60)
                yield f"data: {json.dumps(item, default=str)}\n\n"
                
                if item.get("type") == "complete" or item.get("type") == "error":
                    break
            except queue.Empty:
                yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
    
    return Response(generate(), mimetype="text/event-stream")


@app.route("/api/telemetry")
def get_telemetry():
    if SESSION_DATA.get("telemetry") is None:
        return jsonify({"error": "No telemetry available"}), 400
    return jsonify(SESSION_DATA["telemetry"])


@app.route("/api/commands")
def get_commands():
    return jsonify({
        "commands": SESSION_DATA.get("command_logs", []),
        "total": len(SESSION_DATA.get("command_logs", []))
    })


@app.route("/api/prompts")
def get_prompts():
    return jsonify(SESSION_DATA.get("prompts", {}))


@app.route("/api/agents")
def get_agents():
    return jsonify({
        "agent1": SESSION_DATA["agent_outputs"].get("agent1", ""),
        "agent2": SESSION_DATA["agent_outputs"].get("agent2", ""),
        "agent3": SESSION_DATA["agent_outputs"].get("agent3", "")
    })


@app.route("/api/report")
def get_report():
    return jsonify({
        "telemetry": SESSION_DATA.get("telemetry"),
        "command_logs": SESSION_DATA.get("command_logs", []),
        "agent_outputs": SESSION_DATA["agent_outputs"],
        "model": SESSION_DATA.get("model")
    })


@app.route("/api/download/pdf")
def download_pdf():
    if not SESSION_DATA.get("telemetry"):
        return jsonify({"error": "No report available"}), 400
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=TA_CENTER, 
                                  textColor=colors.HexColor('#00ff88'), spaceAfter=20)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER,
                                     textColor=colors.HexColor('#888888'), spaceAfter=30)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, 
                                    textColor=colors.HexColor('#00ff88'), spaceBefore=20, spaceAfter=10)
    subheading_style = ParagraphStyle('SubHeading', parent=styles['Heading3'], fontSize=12,
                                      textColor=colors.HexColor('#00ccff'), spaceBefore=15, spaceAfter=8)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=12)
    code_style = ParagraphStyle('Code', parent=styles['Code'], fontSize=8, leading=10,
                                fontName='Courier', backColor=colors.HexColor('#1a1a2e'))
    
    story.append(Paragraph("Sentinel Security Analysis Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Model: {SESSION_DATA.get('model', 'N/A')}", subtitle_style))
    
    tel = SESSION_DATA.get("telemetry", {})
    host = tel.get("host", {})
    
    story.append(Paragraph("System Overview", heading_style))
    host_data = [
        ["Property", "Value"],
        ["Hostname", host.get("node", "Unknown")],
        ["Operating System", f"{host.get('system', '')} {host.get('release', '')}"],
        ["Architecture", host.get("machine", "Unknown")],
        ["Boot Time", tel.get("boot_time_utc", "Unknown")],
        ["CPU Cores", str(tel.get("cpu", {}).get("logical_cpus", "Unknown"))],
    ]
    
    t = Table(host_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00ff88')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#333333')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#0d1117')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#0d1117'), colors.HexColor('#161b22')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Telemetry Collection Commands", heading_style))
    for cmd in SESSION_DATA.get("command_logs", [])[:15]:
        cmd_text = f"<b>[{cmd.get('category', 'N/A')}]</b> {cmd.get('description', '')}"
        status_color = '#00ff88' if cmd.get('status') == 'success' else '#ff4444'
        story.append(Paragraph(f"<font color='{status_color}'>{cmd.get('status', '').upper()}</font> | {cmd_text}", body_style))
        story.append(Paragraph(f"<font color='#888888'>{cmd.get('command', '')}</font>", code_style))
        if cmd.get('output'):
            story.append(Paragraph(f"<font color='#00ccff'>Output:</font> {cmd.get('output', '')[:200]}...", code_style))
        story.append(Spacer(1, 5))
    
    story.append(PageBreak())
    
    story.append(Paragraph("Agent 1: Telemetry Analysis", heading_style))
    story.append(Paragraph(SESSION_DATA["agent_outputs"].get("agent1", "No output"), body_style))
    story.append(PageBreak())
    
    story.append(Paragraph("Agent 2: Attack Surface Mapping", heading_style))
    story.append(Paragraph(SESSION_DATA["agent_outputs"].get("agent2", "No output"), body_style))
    story.append(PageBreak())
    
    story.append(Paragraph("Agent 3: Tabletop Scenario", heading_style))
    story.append(Paragraph(SESSION_DATA["agent_outputs"].get("agent3", "No output"), body_style))
    
    doc.build(story)
    buffer.seek(0)
    
    filename = f"Sentinel_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)


if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=5000, host='0.0.0.0')

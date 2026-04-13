from PIL import Image, ImageDraw, ImageFont
import os

def create_architecture_diagram():
    width, height = 900, 700
    img = Image.new('RGB', (width, height), '#0a0a14')
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fall back to default if not available
    try:
        title_font = ImageFont.truetype("arial.ttf", 24)
        header_font = ImageFont.truetype("arial.ttf", 16)
        box_font = ImageFont.truetype("arial.ttf", 12)
        small_font = ImageFont.truetype("arial.ttf", 10)
    except:
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        box_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Colors
    cyan = '#00d4ff'
    blue = '#0a84ff'
    purple = '#bf5af2'
    green = '#30d158'
    white = '#ffffff'
    gray = '#86868b'
    dark_bg = '#1d1d1f'
    
    # Title
    draw.text((width//2, 30), "Cipher System Architecture", font=title_font, fill=cyan, anchor='mt')
    
    # Main container box
    container_padding = 20
    container_top = 70
    container_bottom = height - 30
    draw.rectangle([container_padding, container_top, width - container_padding, container_bottom], outline=cyan, width=2)
    
    # Layer 1: Data Collection (Top)
    layer1_y = 90
    layer1_height = 100
    draw.rectangle([40, layer1_y, 860, layer1_y + layer1_height], fill=dark_bg, outline=blue, width=2)
    draw.text((450, layer1_y + 10), "LAYER 1: DATA COLLECTION", font=header_font, fill=blue, anchor='mt')
    
    # Layer 1 boxes
    boxes_l1 = [
        (60, 125, 180, 175, "LoggingCollector\n(psutil)"),
        (200, 125, 340, 175, "System Calls\nCPU/Memory/Disk\nNetwork"),
        (360, 125, 520, 175, "Command Logger\nTimestamp + Output\nDuration + Status"),
        (540, 125, 700, 175, "SSE Event\nEmitter"),
        (720, 125, 840, 175, "Dashboard\n(Web UI)"),
    ]
    
    for x1, y1, x2, y2, text in boxes_l1:
        draw.rectangle([x1, y1, x2, y2], fill='#2d2d30', outline=gray, width=1)
        lines = text.split('\n')
        text_y = y1 + 15
        for line in lines:
            draw.text(((x1+x2)//2, text_y), line, font=small_font, fill=white, anchor='mt')
            text_y += 15
    
    # Arrows between layer 1 boxes
    arrow_y = 150
    for i in range(len(boxes_l1) - 1):
        x1 = boxes_l1[i][2]
        x2 = boxes_l1[i+1][0]
        mid_x = (x1 + x2) // 2
        draw.line([(x1, arrow_y), (x2, arrow_y)], fill=cyan, width=2)
        draw.polygon([(x2-8, arrow_y-4), (x2-8, arrow_y+4), (x2, arrow_y)], fill=cyan)
    
    # Layer 2: AI Processing (Middle)
    layer2_y = 200
    layer2_height = 140
    draw.rectangle([40, layer2_y, 860, layer2_y + layer2_height], fill=dark_bg, outline=purple, width=2)
    draw.text((450, layer2_y + 10), "LAYER 2: AI PROCESSING (DeepSeek LLM)", font=header_font, fill=purple, anchor='mt')
    
    # Layer 2 boxes
    boxes_l2 = [
        (60, 240, 260, 320, "Agent 1\nTelemetry\nAnalyst"),
        (280, 240, 480, 320, "Agent 2\nAttack Surface\nMapper"),
        (500, 240, 700, 320, "Agent 3\nTabletop\nScenario"),
        (720, 240, 840, 320, "OpenRouter\nAPI"),
    ]
    
    for x1, y1, x2, y2, text in boxes_l2:
        draw.rectangle([x1, y1, x2, y2], fill='#2d2d30', outline=gray, width=1)
        lines = text.split('\n')
        text_y = y1 + 15
        for line in lines:
            draw.text(((x1+x2)//2, text_y), line, font=small_font, fill=white, anchor='mt')
            text_y += 15
    
    # Arrows in layer 2
    draw.line([(260, 280), (280, 280)], fill=purple, width=2)
    draw.polygon([(275, 276), (275, 284), (283, 280)], fill=purple)
    draw.line([(480, 280), (500, 280)], fill=purple, width=2)
    draw.polygon([(495, 276), (495, 284), (503, 280)], fill=purple)
    draw.line([(700, 280), (720, 280)], fill=purple, width=2)
    draw.polygon([(715, 276), (715, 284), (723, 280)], fill=purple)
    
    # Layer 3: Dashboard (Bottom)
    layer3_y = 365
    layer3_height = 120
    draw.rectangle([40, layer3_y, 860, layer3_y + layer3_height], fill=dark_bg, outline=green, width=2)
    draw.text((450, layer3_y + 10), "LAYER 3: DASHBOARD DISPLAY", font=header_font, fill=green, anchor='mt')
    
    # Layer 3 boxes
    boxes_l3 = [
        (60, 400, 280, 465, "Flask Server\nAPI + SSE"),
        (300, 400, 520, 465, "Command Log\nTerminal View"),
        (540, 400, 760, 465, "Agent Outputs\nReal-time AI\nThinking"),
        (780, 400, 840, 465, "Progress\nIndicators"),
    ]
    
    for x1, y1, x2, y2, text in boxes_l3:
        draw.rectangle([x1, y1, x2, y2], fill='#2d2d30', outline=gray, width=1)
        lines = text.split('\n')
        text_y = y1 + 15
        for line in lines:
            draw.text(((x1+x2)//2, text_y), line, font=small_font, fill=white, anchor='mt')
            text_y += 15
    
    # Arrows in layer 3
    for i in range(len(boxes_l3) - 1):
        x1 = boxes_l3[i][2]
        x2 = boxes_l3[i+1][0]
        mid_x = (x1 + x2) // 2
        draw.line([(x1, 430), (x2, 430)], fill=green, width=2)
        draw.polygon([(x2-8, 426), (x2-8, 434), (x2, 430)], fill=green)
    
    # Layer 4: Report Generation
    layer4_y = 510
    layer4_height = 80
    draw.rectangle([40, layer4_y, 860, layer4_y + layer4_height], fill=dark_bg, outline=cyan, width=2)
    draw.text((450, layer4_y + 10), "LAYER 4: REPORT GENERATION", font=header_font, fill=cyan, anchor='mt')
    
    # Layer 4 boxes
    boxes_l4 = [
        (60, 540, 280, 575, "ReportLab\nPDF Generator"),
        (300, 540, 600, 575, "Professional Report\nSystem Overview + Agent Outputs"),
        (620, 540, 840, 575, "Downloadable\nPDF Report"),
    ]
    
    for x1, y1, x2, y2, text in boxes_l4:
        draw.rectangle([x1, y1, x2, y2], fill='#2d2d30', outline=gray, width=1)
        lines = text.split('\n')
        text_y = y1 + 12
        for line in lines:
            draw.text(((x1+x2)//2, text_y), line, font=small_font, fill=white, anchor='mt')
            text_y += 14
    
    # Arrows in layer 4
    draw.line([(280, 557), (300, 557)], fill=cyan, width=2)
    draw.polygon([(295, 553), (295, 561), (303, 557)], fill=cyan)
    draw.line([(600, 557), (620, 557)], fill=cyan, width=2)
    draw.polygon([(615, 553), (615, 561), (623, 557)], fill=cyan)
    
    # Vertical connections between layers
    draw.line([(110, 175), (110, 240)], fill=gray, width=1)
    draw.polygon([(106, 235), (114, 235), (110, 243)], fill=gray)
    draw.line([(110, 320), (110, 400)], fill=gray, width=1)
    draw.polygon([(106, 395), (114, 395), (110, 403)], fill=gray)
    draw.line([(110, 465), (110, 510)], fill=gray, width=1)
    draw.line([(110, 510), (110, 540)], fill=gray, width=1)
    draw.polygon([(106, 535), (114, 535), (110, 543)], fill=gray)
    
    # Legend
    draw.rectangle([700, 620, 860, 670], outline=gray, width=1)
    draw.text((710, 628), "LEGEND:", font=small_font, fill=gray)
    draw.rectangle([710, 648, 720, 656], fill=blue)
    draw.text((725, 648), "Collection", font=small_font, fill=gray)
    draw.rectangle([710, 660, 720, 668], fill=purple)
    draw.text((725, 660), "AI Processing", font=small_font, fill=gray)
    
    # Save
    img_path = os.path.join(os.path.dirname(__file__), 'architecture.png')
    img.save(img_path)
    print(f"Architecture diagram saved to {img_path}")

if __name__ == "__main__":
    create_architecture_diagram()

from PIL import Image, ImageDraw, ImageFont
import os

def create_diagram():
    width, height = 900, 550
    img = Image.new('RGB', (width, height), '#ffffff')
    draw = ImageDraw.Draw(img)
    
    # Professional colors
    primary = '#1e3a5f'
    secondary = '#3d5a80'
    accent = '#98c1d9'
    text = '#1e293b'
    gray = '#64748b'
    light = '#f1f5f9'
    
    # Fonts
    try:
        title_font = ImageFont.truetype("arial.ttf", 16)
        header_font = ImageFont.truetype("arial.ttf", 11)
        box_font = ImageFont.truetype("arial.ttf", 9)
        arrow_font = ImageFont.truetype("arial.ttf", 8)
    except:
        title_font = ImageFont.load_default()
        header_font = title_font
        box_font = title_font
        arrow_font = title_font
    
    # Title
    draw.text((width//2, 25), "System Architecture", font=title_font, fill=text, anchor='mt')
    
    # Main flow - horizontal pipeline
    box_h = 55
    box_w = 100
    start_x = 80
    start_y = 100
    gap = 60
    
    # Components with labels
    components = [
        ("Windows\nSystem", light, primary),
        ("Logging\nCollector", light, secondary),
        ("Telemetry\nJSON", light, secondary),
        ("Agent\nChain", light, secondary),
        ("DeepSeek\nLLM", light, secondary),
        ("Dashboard", light, secondary),
        ("PDF\nReport", light, primary),
    ]
    
    # Draw pipeline boxes
    x = start_x
    for i, (label, bg, border) in enumerate(components):
        # Box with rounded corners effect
        draw.rectangle([x, start_y, x + box_w, start_y + box_h], fill=bg, outline=border, width=2)
        
        # Label
        lines = label.split('\n')
        text_y = start_y + 15
        for line in lines:
            draw.text((x + box_w//2, text_y), line, font=box_font, fill=text, anchor='mt')
            text_y += 14
        
        # Arrow to next
        if i < len(components) - 1:
            arrow_start = x + box_w
            arrow_end = x + box_w + gap
            arrow_mid = arrow_start + gap//2
            
            # Arrow line
            draw.line([(arrow_start, start_y + box_h//2), (arrow_end, start_y + box_h//2)], fill=gray, width=2)
            
            # Arrow head
            draw.polygon([
                (arrow_end, start_y + box_h//2),
                (arrow_end - 10, start_y + box_h//2 - 6),
                (arrow_end - 10, start_y + box_h//2 + 6)
            ], fill=gray)
    
    # Labels under boxes
    labels = ["OS", "Python", "Data", "AI", "Analysis", "UI", "Output"]
    for i, label in enumerate(labels):
        draw.text((start_x + i * (box_w + gap) + box_w//2, start_y + box_h + 15), label, font=arrow_font, fill=gray, anchor='mt')
    
    # Detail boxes below
    detail_y = 220
    detail_h = 45
    detail_w = 85
    
    # Layer 1 details
    layer1_x = 80
    draw.text((layer1_x, detail_y), "Layer 1: Collection", font=header_font, fill=text)
    
    details1 = ["cpu_percent()", "process_iter()", "net_connections()", "disk_usage()", "virtual_memory()"]
    dx = layer1_x
    for d in details1:
        draw.rectangle([dx, detail_y + 20, dx + detail_w, detail_y + detail_h], fill=light, outline=gray, width=1)
        draw.text((dx + detail_w//2, detail_y + 35), d, font=arrow_font, fill=gray, anchor='mt')
        dx += detail_w + 5
    
    # Arrow down from telemetry
    mid_x = start_x + 2 * (box_w + gap) + box_w//2
    draw.line([(mid_x, start_y + box_h), (mid_x, detail_y)], fill=gray, width=1)
    draw.polygon([(mid_x, detail_y), (mid_x - 5, detail_y + 8), (mid_x + 5, detail_y + 8)], fill=gray)
    
    # Layer 2 details
    layer2_x = 80
    detail_y2 = 310
    draw.text((layer2_x, detail_y2), "Layer 2: AI Processing", font=header_font, fill=text)
    
    details2 = ["Telemetry Analyst", "Attack Mapper", "Scenario Author", "OpenRouter API"]
    dx = layer2_x
    for d in details2:
        draw.rectangle([dx, detail_y2 + 20, dx + detail_w + 20, detail_y2 + detail_h], fill=light, outline=gray, width=1)
        draw.text((dx + (detail_w + 20)//2, detail_y2 + 35), d, font=arrow_font, fill=gray, anchor='mt')
        dx += detail_w + 25
    
    # Arrow down from Agent Chain
    mid_x2 = start_x + 3 * (box_w + gap) + box_w//2
    draw.line([(mid_x2, start_y + box_h), (mid_x2, detail_y2)], fill=gray, width=1)
    draw.polygon([(mid_x2, detail_y2), (mid_x2 - 5, detail_y2 + 8), (mid_x2 + 5, detail_y2 + 8)], fill=gray)
    
    # Layer 3 details
    layer3_x = 80
    detail_y3 = 400
    draw.text((layer3_x, detail_y3), "Layer 3: Display", font=header_font, fill=text)
    
    details3 = ["Command Log", "Agent Outputs", "Progress", "Real-time SSE"]
    dx = layer3_x
    for d in details3:
        draw.rectangle([dx, detail_y3 + 20, dx + detail_w + 15, detail_y3 + detail_h], fill=light, outline=gray, width=1)
        draw.text((dx + (detail_w + 15)//2, detail_y3 + 35), d, font=arrow_font, fill=gray, anchor='mt')
        dx += detail_w + 20
    
    # Arrow down from Dashboard
    mid_x3 = start_x + 5 * (box_w + gap) + box_w//2
    draw.line([(mid_x3, start_y + box_h), (mid_x3, detail_y3)], fill=gray, width=1)
    draw.polygon([(mid_x3, detail_y3), (mid_x3 - 5, detail_y3 + 8), (mid_x3 + 5, detail_y3 + 8)], fill=gray)
    
    # Layer 4 details
    layer4_x = 80
    detail_y4 = 490
    draw.text((layer4_x, detail_y4), "Layer 4: Output", font=header_font, fill=text)
    
    details4 = ["ReportLab", "System Overview", "Agent Analysis", "PDF"]
    dx = layer4_x
    for d in details4:
        draw.rectangle([dx, detail_y4 + 15, dx + detail_w + 15, detail_y4 + 40], fill=light, outline=gray, width=1)
        draw.text((dx + (detail_w + 15)//2, detail_y4 + 28), d, font=arrow_font, fill=gray, anchor='mt')
        dx += detail_w + 20
    
    # Flow number indicators on arrows
    flow_positions = [
        (start_x + box_w + 15, start_y + box_h//2 - 20, "1"),
        (start_x + 2*(box_w + gap) + 15, start_y + box_h//2 - 20, "2"),
        (start_x + 3*(box_w + gap) + 10, start_y + box_h//2 - 20, "3"),
        (start_x + 4*(box_w + gap) + 15, start_y + box_h//2 - 20, "4"),
        (start_x + 5*(box_w + gap) + 15, start_y + box_h//2 - 20, "5"),
        (start_x + 6*(box_w + gap) - 30, start_y + box_h//2 - 20, "6"),
    ]
    
    for fx, fy, num in flow_positions:
        draw.ellipse([fx, fy, fx + 18, fy + 18], fill=secondary, outline=secondary)
        draw.text((fx + 9, fy + 9), num, font=arrow_font, fill='white', anchor='mt')
    
    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'architecture.png')
    img.save(output_path)
    print(f"Diagram saved to {output_path}")

if __name__ == "__main__":
    create_diagram()

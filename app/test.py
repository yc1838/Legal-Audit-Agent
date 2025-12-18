from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def create_report():
    doc = SimpleDocTemplate("Agent_Test_Report.pdf", pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    # 1. 标题
    title = Paragraph("<b>Contract Review Agent - Accuracy Test Report</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    subtitle = Paragraph("Target: Auto Loan ABS Indenture | Model: GPT-5.2", styles['Normal'])
    elements.append(subtitle)
    elements.append(Spacer(1, 20))

    # 2. 表格数据
    data = [
        ["No.", "Error Type", "Trap (Planted Error)", "Agent Detection Result", "Status"],
        
        ["1", "Consistency", 
         "Cover Date (Feb 23) != Body Date (Feb 28)", 
         "DETECTED: Identified inconsistent 'as of' dates between cover and body.", 
         "PASS"],
         
        ["2", "Logic & Typo", 
         "First Payment (Jan 15) is before Closing (Feb). Typo: 'Janurary'", 
         "DETECTED: Flagged as 'illogical' template carryover. Caught typo 'Janurary'.", 
         "PASS"],
         
        ["3", "Validity & Typo", 
         "Non-existent date: 'Feburary 30'. Typo: 'Feburary'", 
         "DETECTED: Stated 'February 30 is a non-existent date'. Caught typo 'Feburary'.", 
         "PASS"],
         
        ["4", "Reasoning", 
         "Annual Report due 1 month after closing (March 2023)", 
         "DETECTED: Flagged as inconsistent with review period; identified as template error.", 
         "PASS"]
    ]

    # 3. 表格样式
    table = Table(data, colWidths=[30, 70, 140, 200, 50])
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue), # 表头背景色
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke), # 表头文字色
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige), # 内容背景色
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('TEXTCOLOR', (-1, 1), (-1, -1), colors.green), # "PASS" 设为绿色
        ('FONTNAME', (-1, 1), (-1, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('WORDWRAP', (0, 0), (-1, -1), True),
    ])
    table.setStyle(style)
    
    elements.append(table)
    
    # 4. 结论
    elements.append(Spacer(1, 20))
    summary = Paragraph(
        "<b>Summary:</b> The Agent successfully identified 100% of the planted logical and syntax errors. "
        "It demonstrated reasoning capabilities by identifying chronological inconsistencies and valid calendar dates.", 
        styles['Normal']
    )
    elements.append(summary)

    # 生成 PDF
    doc.build(elements)
    print("PDF Report generated: Agent_Test_Report.pdf")

if __name__ == "__main__":
    create_report()
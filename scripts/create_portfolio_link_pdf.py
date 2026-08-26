from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import Color, HexColor, black, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "ham-sihyeon-portfolio-link.pdf"
URL = "https://dolbakggom.com/"


def register_fonts():
    font_path = Path("/System/Library/Fonts/AppleSDGothicNeo.ttc")
    if font_path.exists():
        pdfmetrics.registerFont(TTFont("AppleSD", str(font_path), subfontIndex=0))
        return "AppleSD"
    return "Helvetica"


def rounded_link(c, x, y, w, h, radius, url):
    c.linkURL(url, (x, y, x + w, y + h), relative=0, thickness=0)


def draw_logo(c, x, y, scale=1.0, color=white):
    # Portfolio mark from the public homepage SVG, redrawn as a PDF vector path.
    points = [
        (22.0732, 0.001), (27.4131, 0.001), (27.4131, 49.124),
        (44.1484, 39.4609), (44.1484, 16.8125), (49.4883, 16.8125),
        (49.4883, 42.5039), (49.4873, 42.5479), (27.4141, 55.291),
        (27.4131, 55.2891), (22.0732, 55.2891), (22.0732, 6.16602),
        (5.33984, 15.8271), (5.33984, 38.4883), (0, 38.4883),
        (0, 12.7432), (22.0723, 0),
    ]
    p = c.beginPath()
    p.moveTo(x + points[0][0] * scale, y - points[0][1] * scale)
    for px, py in points[1:]:
        p.lineTo(x + px * scale, y - py * scale)
    p.close()
    c.setFillColor(color)
    c.drawPath(p, fill=1, stroke=0)


def draw_qr(c, x, y, size):
    widget = qr.QrCodeWidget(URL)
    bounds = widget.getBounds()
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(widget)
    renderPDF.draw(drawing, c, x, y)


def make_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font = register_fonts()
    w, h = A4
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("함시현 포트폴리오 | Beyond the Answer.")
    c.setAuthor("함시현")
    c.setSubject("웹 포트폴리오 연결 문서")

    acid = HexColor("#08C840")
    paper = HexColor("#F4F4F4")
    soft_white = Color(1, 1, 1, alpha=0.58)

    c.setFillColor(black)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    margin = 42
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(soft_white)
    c.drawString(margin, h - margin, "PORTFOLIO / 2026")
    c.setFillColor(acid)
    c.circle(w - margin - 4, h - margin + 3, 4, fill=1, stroke=0)

    logo_scale = 1.08
    logo_w = 49.49 * logo_scale
    draw_logo(c, (w - logo_w) / 2, h - 184, logo_scale)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 29)
    title = "Beyond the Answer."
    c.drawCentredString(w / 2, h - 266, title)
    c.setFont(font, 11)
    c.setFillColor(soft_white)
    c.drawCentredString(w / 2, h - 292, "답을 넘어, 더 나은 경험을 설계합니다.")

    # Lower information card
    card_x, card_y, card_w, card_h = margin, 78, w - margin * 2, 330
    c.setFillColor(paper)
    c.roundRect(card_x, card_y, card_w, card_h, 22, fill=1, stroke=0)

    inner_x = card_x + 30
    c.setFillColor(black)
    c.setFont(font, 10)
    c.drawString(inner_x, card_y + card_h - 44, "함시현  ·  SIHYEON HAM")
    c.setFont("Helvetica-Bold", 21)
    c.drawString(inner_x, card_y + card_h - 78, "UI/UX & BX DESIGNER")

    c.setStrokeColor(Color(0, 0, 0, alpha=0.14))
    c.setLineWidth(0.7)
    c.line(inner_x, card_y + card_h - 102, card_x + card_w - 30, card_y + card_h - 102)

    c.setFillColor(Color(0, 0, 0, alpha=0.52))
    c.setFont(font, 9)
    c.drawString(inner_x, card_y + card_h - 130, "SELECTED WORK")
    c.setFillColor(black)
    c.setFont(font, 11)
    projects = [
        "ROii HMI UI 디자인",
        "HEXA LABS 홈페이지 UI 디자인",
        "Rush Hour App Concept",
    ]
    py = card_y + card_h - 157
    for idx, item in enumerate(projects, start=1):
        c.setFillColor(acid)
        c.circle(inner_x + 3, py + 3, 3, fill=1, stroke=0)
        c.setFillColor(black)
        c.drawString(inner_x + 15, py, item)
        py -= 25

    # Clickable CTA and QR
    cta_x, cta_y, cta_w, cta_h = inner_x, card_y + 34, 265, 54
    c.setFillColor(acid)
    c.roundRect(cta_x, cta_y, cta_w, cta_h, 12, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont(font, 12)
    c.drawString(cta_x + 18, cta_y + 21, "웹 포트폴리오 보기")
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(cta_x + cta_w - 18, cta_y + 19, ">")
    rounded_link(c, cta_x, cta_y, cta_w, cta_h, 12, URL)

    qr_size = 80
    qr_x = card_x + card_w - 30 - qr_size
    qr_y = card_y + 26
    c.setFillColor(white)
    c.roundRect(qr_x - 7, qr_y - 7, qr_size + 14, qr_size + 14, 10, fill=1, stroke=0)
    draw_qr(c, qr_x, qr_y, qr_size)
    rounded_link(c, qr_x - 7, qr_y - 7, qr_size + 14, qr_size + 14, 10, URL)

    c.setFont("Helvetica", 8)
    c.setFillColor(Color(0, 0, 0, alpha=0.5))
    c.drawString(inner_x, card_y + 18, "dolbakggom.com")
    c.linkURL(URL, (inner_x, card_y + 12, inner_x + 95, card_y + 27), relative=0, thickness=0)

    c.setFillColor(Color(1, 1, 1, alpha=0.36))
    c.setFont(font, 7.5)
    c.drawCentredString(w / 2, 43, "버튼 또는 QR 코드를 선택하면 전체 프로젝트를 확인할 수 있습니다.")

    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    make_pdf()

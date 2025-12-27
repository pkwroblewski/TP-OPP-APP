import fitz, re
from typing import List, Dict, Any
from .models import StatementLine
CAPTIONS = {
    'total_assets': [r'Total\s+assets', r'Total\s+du\s+bilan', r'Summe\s+der\s+Aktiva'],
    'total_equity_liabilities': [r'Total\s+equity\s+and\s+liabilities', r'Total\s+des\s+capitaux\s+propres.*passif', r'Summe\s+des\s+Eigenkapitals.*Passiva'],
}
def extract_text_blocks(doc):
    out = []
    for pno in range(len(doc)):
        page = doc[pno]
        for block in page.get_text('blocks'):
            x0,y0,x1,y1, text, *_ = block
            out.append({'page': pno, 'bbox': (x0,y0,x1,y1), 'text': text})
    return out
def find_first(doc, patterns: List[str]):
    blocks = extract_text_blocks(doc)
    for i, blk in enumerate(blocks):
        for pat in patterns:
            if re.search(pat, blk['text'] or '', flags=re.I):
                return i, blk
    return None, None
def parse_mvp(pdf_path: str) -> Dict[str, Any]:
    doc = fitz.open(pdf_path)
    anchors = []
    lines = []
    for key, pats in CAPTIONS.items():
        idx, blk = find_first(doc, pats)
        if not blk: 
            continue
        page = doc[blk['page']]
        text = page.get_text('text')
        nums = re.findall(r'(-?\d[\d\s\.\,]{2,})', text)
        value = None
        if nums:
            raw = nums[-1].replace(' ','').replace('.','').replace(',','.')
            try: value = float(raw)
            except: value = None
        anc_idx = len(anchors)
        anchors.append({'source_type': 'text', 'page': blk['page']+1, 'bbox': blk['bbox'], 'snippet': (blk['text'] or '')[:200]})
        caption_map = {
            'total_assets': ('Total Assets', 'assets'),
            'total_equity_liabilities': ('Total Equity and Liabilities', 'liabilities'),
        }
        caption, side = caption_map[key]
        lines.append(StatementLine(
            statement_type='balance_sheet',
            ref_code=None,
            caption=caption,
            side=side,
            period='current',
            value=value,
        ).model_dump() | {'anchor_indices':[anc_idx]})
    return {'anchors': anchors, 'lines': lines}


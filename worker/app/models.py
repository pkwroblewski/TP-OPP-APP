from pydantic import BaseModel, Field
from typing import List, Tuple, Optional, Literal
Status = Literal['extracted','not_found','ambiguous']
class Anchor(BaseModel):
    file_hash: str | None = None
    page: int
    bbox: Tuple[float, float, float, float]
    snippet: str
class StatementLine(BaseModel):
    statement_type: Literal['balance_sheet','pnl']
    ref_code: Optional[str] = None
    caption: str
    side: Optional[Literal['assets','liabilities','equity','revenue','expense']] = None
    period: Literal['current','previous']
    value: Optional[float] = None
    unit: Literal['EUR'] = 'EUR'
    status: Status = 'extracted'
    anchors: List[Anchor] = Field(default_factory=list)


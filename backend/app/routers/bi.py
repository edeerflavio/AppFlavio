from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.bi_service import BIService

router = APIRouter(prefix="/api/bi", tags=["bi"])

@router.get("/stats")
async def bi_stats(db: AsyncSession = Depends(get_db)):
    """BI dashboard statistics."""
    data = await BIService.get_stats(db)
    
    records = data["records"]
    stats = data["stats"]
    
    return {
        "status": "success",
        "stats": stats,
        "records": [
            {
                "iniciais": r.iniciais,
                "cenario": r.cenario,
                "cid_principal": r.cid_principal,
                "cid_desc": r.cid_desc,
                "gravidade_estimada": r.gravidade_estimada,
                "sinais_vitais": r.sinais_vitais,
                "hora": r.hora,
                "dia_semana": r.dia_semana,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in records
        ],
    }

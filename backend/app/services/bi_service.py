from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import BIRecord

class BIService:
    @staticmethod
    async def get_stats(db: AsyncSession):
        total_result = await db.execute(select(func.count(BIRecord.id)))
        total = total_result.scalar() or 0

        graves_result = await db.execute(
            select(func.count(BIRecord.id)).where(BIRecord.gravidade_estimada == "Grave")
        )
        graves = graves_result.scalar() or 0

        cenarios_result = await db.execute(select(func.count(func.distinct(BIRecord.cenario))))
        cenarios = cenarios_result.scalar() or 0

        cids_result = await db.execute(select(func.count(func.distinct(BIRecord.cid_principal))))
        cids = cids_result.scalar() or 0

        records_result = await db.execute(
            select(BIRecord).order_by(BIRecord.timestamp.desc()).limit(200)
        )
        records = records_result.scalars().all()

        return {
            "stats": {"total": total, "graves": graves, "cenarios": cenarios, "cids": cids},
            "records": records
        }

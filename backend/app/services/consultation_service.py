from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import ConsultationRecord

class ConsultationService:
    @staticmethod
    async def get_consultations(
        db: AsyncSession,
        limit: int = 20,
        offset: int = 0,
        cenario: str | None = None,
        gravidade: str | None = None
    ):
        query = select(ConsultationRecord).order_by(ConsultationRecord.created_at.desc())

        if cenario:
            query = query.where(ConsultationRecord.cenario_atendimento == cenario)
        if gravidade:
            query = query.where(ConsultationRecord.gravidade == gravidade)

        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_consultation_by_id(db: AsyncSession, consultation_id: int):
        result = await db.execute(
            select(ConsultationRecord).where(ConsultationRecord.id == consultation_id)
        )
        return result.scalar_one_or_none()

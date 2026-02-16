from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.consultation_service import ConsultationService

router = APIRouter(prefix="/api/consultations", tags=["consultations"])

@router.get("")
async def list_consultations(
    limit: int = 20,
    offset: int = 0,
    cenario: str | None = None,
    gravidade: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List consultations with optional filters."""
    records = await ConsultationService.get_consultations(db, limit, offset, cenario, gravidade)

    return {
        "status": "success",
        "count": len(records),
        "data": [
            {
                "id": r.id,
                "iniciais": r.iniciais,
                "paciente_id": r.paciente_id,
                "idade": r.idade,
                "cenario_atendimento": r.cenario_atendimento,
                "cid_principal": {"code": r.cid_principal_code, "desc": r.cid_principal_desc},
                "gravidade": r.gravidade,
                "sinais_vitais": r.sinais_vitais,
                "total_falas": r.total_falas,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
    }

@router.get("/{consultation_id}")
async def get_consultation(consultation_id: int, db: AsyncSession = Depends(get_db)):
    """Get full consultation detail."""
    record = await ConsultationService.get_consultation_by_id(db, consultation_id)

    if not record:
        raise HTTPException(status_code=404, detail="Consulta não encontrada")

    return {
        "status": "success",
        "data": {
            "id": record.id,
            "iniciais": record.iniciais,
            "paciente_id": record.paciente_id,
            "idade": record.idade,
            "cenario_atendimento": record.cenario_atendimento,
            "cid_principal": {"code": record.cid_principal_code, "desc": record.cid_principal_desc},
            "gravidade": record.gravidade,
            "sinais_vitais": record.sinais_vitais,
            "soap": record.soap_json,
            "jsonUniversal": record.json_universal,
            "clinicalData": record.clinical_data_json,
            "dialog": record.dialog_json,
            "documents": record.documents_json,
            "metadata": {
                "total_falas": record.total_falas,
                "falas_medico": record.falas_medico,
                "falas_paciente": record.falas_paciente,
            },
            "created_at": record.created_at.isoformat() if record.created_at else None,
        },
    }

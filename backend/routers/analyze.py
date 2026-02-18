"""
routers/analyze.py — Analyze Endpoint
Medical Scribe Enterprise v3.0
POST /api/analyze: text → SOAP + documents + DB persistence
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.database import get_db, ConsultationRecord, BIRecord
from core.security import process_patient_input
from services.soap_engine import process as soap_process
from services.documents import generate_all

logger = logging.getLogger("medical-scribe")

router = APIRouter(prefix="/api", tags=["analyze"])


# ── Request / Response Models ──

class AnalyzeRequest(BaseModel):
    nome_completo: str = "Paciente Anônimo"
    idade: int = 0
    cenario_atendimento: str = "PS"
    texto_transcrito: str


class AnalyzeResponse(BaseModel):
    success: bool
    patient: dict | None = None
    soap: dict | None = None
    clinicalData: dict | None = None
    jsonUniversal: dict | None = None
    dialog: list[dict] = []
    metadata: dict | None = None
    documents: dict | None = None
    consultation_id: int | None = None
    errors: list[str] | None = None


# ══════════════════════════════════════════════════════════════
# POST /api/analyze — Full pipeline
# ══════════════════════════════════════════════════════════════

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    """
    Full analysis pipeline:
    1. LGPD: sanitize patient identity
    2. SOAP: process transcription → structured clinical data
    3. Documents: generate prescription, attestation, exams, patient guide
    4. Persist to PostgreSQL
    """
    try:
        logger.info(f"Analyze request received. Length: {len(request.texto_transcrito)}")

        # 1. LGPD compliance
        try:
            lgpd_result = process_patient_input({
                "nome_completo": request.nome_completo,
                "idade": request.idade,
                "cenario_atendimento": request.cenario_atendimento,
                "texto_transcrito": request.texto_transcrito,
            })
        except Exception as e:
            logger.error(f"LGPD processing failed: {e}", exc_info=True)
            return AnalyzeResponse(success=False, errors=[f"Erro interno de conformidade LGPD: {str(e)}"])

        if not lgpd_result.get("success"):
            return AnalyzeResponse(
                success=False,
                errors=lgpd_result.get("errors", ["Erro na validação LGPD"]),
            )

        patient_data = lgpd_result["data"]
        logger.info(f"LGPD ✅ {patient_data['iniciais']} ({patient_data['paciente_id']})")

        # 2. SOAP processing
        try:
            soap_result = soap_process(request.texto_transcrito)
        except Exception as e:
            logger.error(f"SOAP processing failed: {e}", exc_info=True)
            return AnalyzeResponse(success=False, errors=[f"Erro no processamento clínico (SOAP): {str(e)}"])

        if not soap_result.get("success"):
            return AnalyzeResponse(
                success=False,
                errors=[soap_result.get("error", "Erro no processamento SOAP")],
            )

        logger.info(
            f"SOAP ✅ CID={soap_result['clinicalData']['cid_principal']['code']}, "
            f"Gravidade={soap_result['clinicalData']['gravidade']}"
        )

        # 3. Document generation
        try:
            documents = generate_all(soap_result, patient_data)
            logger.info(f"Docs ✅ {len(documents)} documentos gerados")
        except Exception as e:
            logger.error(f"Document generation failed: {e}", exc_info=True)
            documents = {} # Fallback

        # 4. Persist to PostgreSQL
        try:
            consultation = ConsultationRecord(
                iniciais=patient_data["iniciais"],
                paciente_id=patient_data["paciente_id"],
                idade=patient_data["idade"],
                cenario_atendimento=patient_data["cenario_atendimento"],
                cid_principal_code=soap_result["clinicalData"]["cid_principal"]["code"],
                cid_principal_desc=soap_result["clinicalData"]["cid_principal"]["desc"],
                gravidade=soap_result["clinicalData"]["gravidade"],
                sinais_vitais=soap_result["clinicalData"]["sinais_vitais"],
                soap_json=soap_result["soap"],
                json_universal=soap_result["jsonUniversal"],
                clinical_data_json=soap_result["clinicalData"],
                dialog_json=soap_result["dialog"],
                total_falas=soap_result["metadata"]["total_falas"],
                falas_medico=soap_result["metadata"]["falas_medico"],
                falas_paciente=soap_result["metadata"]["falas_paciente"],
                documents_json=documents,
                texto_transcrito=request.texto_transcrito,
            )
            db.add(consultation)

            bi_record = BIRecord(
                iniciais=patient_data["iniciais"],
                cenario=patient_data["cenario_atendimento"],
                cid_principal=soap_result["clinicalData"]["cid_principal"]["code"],
                cid_desc=soap_result["clinicalData"]["cid_principal"]["desc"],
                gravidade_estimada=soap_result["clinicalData"]["gravidade"],
                sinais_vitais=soap_result["clinicalData"]["sinais_vitais"],
                hora=datetime.now(timezone.utc).hour,
                dia_semana=datetime.now(timezone.utc).strftime("%A"),
            )
            db.add(bi_record)

            await db.commit()
            await db.refresh(consultation)

            logger.info(f"DB ✅ consultation_id={consultation.id}")

        except Exception as e:
            logger.error(f"Database persistence failed: {e}", exc_info=True)
            await db.rollback()
            return AnalyzeResponse(success=False, errors=[f"Erro ao salvar no banco de dados: {str(e)}"])

        # 5. Build response
        return AnalyzeResponse(
            success=True,
            patient=patient_data,
            soap=soap_result["soap"],
            clinicalData=soap_result["clinicalData"],
            jsonUniversal=soap_result["jsonUniversal"],
            dialog=soap_result["dialog"],
            metadata=soap_result["metadata"],
            documents=documents,
            consultation_id=consultation.id,
        )

    except Exception as e:
        logger.error(f"❌ Analyze logic error: {e}", exc_info=True)
        return AnalyzeResponse(success=False, errors=[f"Erro fatal no servidor: {str(e)}"])

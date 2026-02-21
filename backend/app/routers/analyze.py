"""
app/routers/analyze.py — Analyze Endpoint
Medical Scribe Enterprise v3.0
POST /api/analyze: text → SOAP + documents + DB persistence
"""

import os
from datetime import datetime, timezone
from openai import AsyncOpenAI
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

# ── Dr7.ai Client (Real-time Copilot) ──
ai_client = AsyncOpenAI(
    api_key=os.getenv("MEDICAL_API_KEY"),
    base_url="https://dr7.ai/api/v1/medical"
)

# ── OpenAI Client (Systematization & Structured Docs) ──
openai_client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
    # Base URL defaults to OpenAI standard
)


# ── Request / Response Models ──

class ConsultaRequest(BaseModel):
    transcricao: str
    contexto: str


class InsightsResponse(BaseModel):
    analise_clinica: str

class SystematizationRequest(BaseModel):
    transcricao_completa: str
    contexto: str = "Consultório"

class SystematizationResponse(BaseModel):
    prontuario: str
    receituario: str
    atestado: str
    exames: str
    orientacoes: str


@router.post("/analise-clinica", response_model=InsightsResponse)
async def get_clinical_insights(consulta: ConsultaRequest):
    """
    Medical Copilot: Deep clinical analysis using Baichuan AI.
    """
    try:
        system_prompt = (
            f"Você é um assistente sênior de inteligência clínica. O contexto deste atendimento é: {consulta.contexto}. "
            f"Analise a transcrição em tempo real e forneça:\n"
            f"1. Sinais de Alerta (Red Flags) imediatos;\n"
            f"2. Três Diagnósticos Diferenciais (priorizando gravidade/probabilidade);\n"
            f"3. A próxima pergunta crucial para esclarecer o quadro.\n\n"
            f"OBSERVAÇÃO CRÍTICA: Sugira USG Point-of-Care (POCUS) APENAS se houver indicação clínica específica e clara baseada nos sintomas (ex: choque, trauma abdominal, suspeita de TVP); evite sugestões protocolares genéricas."
        )

        response = await ai_client.chat.completions.create(
            model="baichuan-m3",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": consulta.transcricao}
            ],
            temperature=0.2
        )

        analise = response.choices[0].message.content
        return InsightsResponse(analise_clinica=analise)

    except Exception as e:
        print(f"Dr7 API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao processar insights na Dr7.ai")

@router.post("/sistematizar-consulta", response_model=SystematizationResponse)
async def systematize_consultation(request: SystematizationRequest):
    """
    Final systematization using GPT-4o to generate structured clinical documents.
    """
    try:
        system_prompt = (
            "Você é um escriba médico assistente de alto nível. Receba a transcrição bruta da consulta e gere 5 documentos estruturados.\n"
            "Adapte o tom e a conduta à gravidade do caso (ex: conduta imediata para emergência, foco preventivo para consultório).\n"
            "Retorne APENAS um objeto JSON válido com as seguintes chaves:\n"
            "1. 'prontuario': Texto formatado com HDA, Comorbidades, Exame Físico (se citado), Hipóteses e Conduta.\n"
            "2. 'receituario': Medicamentos citados com posologia sugerida e via de administração.\n"
            "3. 'atestado': Sugestão de dias de repouso e CID-10 correspondente.\n"
            "4. 'exames': Liste os exames ditados pelo médico. ALÉM DISSO, você DEVE atuar como um médico assistente proativo: deduza e adicione os exames laboratoriais e de imagem padrão-ouro para o quadro descrito, mesmo que não tenham sido falados. Exemplo: Se for trauma/choque, inclua obrigatoriamente Tipagem Sanguínea, Gasometria Arterial, Lactato, Hemograma, Coagulograma e FAST. Se for dor torácica, inclua Troponina e ECG. Separe visualmente em 'Exames Solicitados na Transcrição' e 'Exames Laboratoriais Sugeridos pelo Protocolo'.\n"
            "5. 'orientacoes': Recomendações em linguagem clara e leiga para o paciente.\n"
            "Formate o texto de cada chave com quebras de linha amigáveis."
        )

        response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Contexto: {request.contexto}\n\nTranscrição: {request.transcricao_completa}"}
            ],
            response_format={"type": "json_object"}
        )

        import json
        raw_content = response.choices[0].message.content
        data = json.loads(raw_content)

        return SystematizationResponse(
            prontuario=data.get("prontuario", ""),
            receituario=data.get("receituario", ""),
            atestado=data.get("atestado", ""),
            exames=data.get("exames", ""),
            orientacoes=data.get("orientacoes", "")
        )

    except Exception as e:
        print(f"OpenAI Systematization Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao sistematizar consulta com GPT-4o")


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
            documents = {}  # Fallback

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

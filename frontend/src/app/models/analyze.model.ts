/**
 * analyze.model.ts — Shared Types
 * Medical Scribe Enterprise v3.0
 */

export interface CidPrincipal {
    code: string;
    desc: string;
}

export interface SinaisVitais {
    pa?: { sistolica: number; diastolica: number; raw: string } | null;
    fc?: { valor: number; raw: string } | null;
    temperatura?: { valor: number; raw: string } | null;
    sato2?: { valor: number; raw: string } | null;
    fr?: { valor: number; raw: string } | null;
}

export interface SOAPSection {
    title: string;
    icon: string;
    content: string;
    sinais_vitais?: SinaisVitais;
}

export interface DialogEntry {
    speaker: string;
    text: string;
}

export interface PatientInfo {
    iniciais: string;
    paciente_id: string;
    idade: number;
    cenario_atendimento: string;
}

export interface ClinicalData {
    cid_principal: CidPrincipal;
    gravidade: string;
    sinais_vitais: SinaisVitais;
    medicacoes_atuais: string[];
    alergias: string[];
    comorbidades: string[];
}

export interface AnalyzeResponse {
    success: boolean;
    patient?: PatientInfo;
    soap?: Record<string, SOAPSection>;
    clinicalData?: ClinicalData;
    jsonUniversal?: Record<string, any>;
    dialog?: DialogEntry[];
    metadata?: {
        total_falas: number;
        falas_medico: number;
        falas_paciente: number;
        processado_em: string;
    };
    documents?: Record<string, any>;
    errors?: string[];
    consultation_id?: number;
}

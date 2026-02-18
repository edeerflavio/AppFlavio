/**
 * scribe.service.ts — Medical Scribe Service
 * Handles API communication with the backend.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyzeResponse } from '../models/analyze.model';

export interface AnalyzePayload {
    nome_completo: string;
    idade: number;
    cenario_atendimento: string;
    texto_transcrito: string;
}

export interface LLMSettings {
    provider: string;
    api_key_masked: string;
    has_api_key: boolean;
    transcription_model: string;
    chat_model: string;
    available_transcription_models: string[];
    available_chat_models: string[];
}

export interface LLMSettingsUpdate {
    api_key?: string;
    transcription_model?: string;
    chat_model?: string;
    provider?: string;
}

export interface TestConnectionResult {
    success: boolean;
    message: string;
    model_tested: string;
}

@Injectable({
    providedIn: 'root'
})
export class ScribeService {
    private http = inject(HttpClient);
    private apiUrl = '/api/analyze';  // Uses proxy.conf.json

    constructor() { }

    analyzeText(payload: AnalyzePayload): Observable<AnalyzeResponse> {
        return this.http.post<AnalyzeResponse>(this.apiUrl, payload);
    }

    transcribeAudio(file: Blob, doctorName: string = ''): Observable<{ text: string }> {
        const formData = new FormData();
        formData.append('file', file, 'recording.webm');
        if (doctorName) {
            formData.append('doctor_name', doctorName);
        }
        return this.http.post<{ text: string }>('/api/transcribe/', formData);
    }

    // ── LLM Settings ──

    getLLMSettings(): Observable<LLMSettings> {
        return this.http.get<LLMSettings>('/api/settings/llm/');
    }

    saveLLMSettings(settings: LLMSettingsUpdate): Observable<LLMSettings> {
        return this.http.put<LLMSettings>('/api/settings/llm/', settings);
    }

    testLLMConnection(): Observable<TestConnectionResult> {
        return this.http.post<TestConnectionResult>('/api/settings/llm/test', {});
    }
}

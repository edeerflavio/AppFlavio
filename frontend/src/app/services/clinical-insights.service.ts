import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InsightsResponse {
    analise_clinica: string;
}

export interface SystematizationResponse {
    prontuario: string;
    receituario: string;
    atestado: string;
    exames: string;
    orientacoes: string;
    [key: string]: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClinicalInsightsService {
    private http = inject(HttpClient);
    private apiUrl = '/api';

    getInsights(transcricao: string, contexto: string): Observable<InsightsResponse> {
        return this.http.post<InsightsResponse>(`${this.apiUrl}/analise-clinica`, {
            transcricao,
            contexto
        });
    }

    sistematizarConsulta(transcricao_completa: string, contexto: string): Observable<SystematizationResponse> {
        return this.http.post<SystematizationResponse>(`${this.apiUrl}/sistematizar-consulta`, {
            transcricao_completa,
            contexto
        });
    }
}

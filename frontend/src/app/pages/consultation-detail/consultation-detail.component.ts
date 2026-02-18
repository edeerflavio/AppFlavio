import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { PatientHeaderComponent } from '../../components/patient-header/patient-header.component';
import { SOAPCardsComponent } from '../../components/soap-cards/soap-cards.component';
import { DocumentsPanelComponent } from '../../components/documents-panel/documents-panel.component';
import { ClinicalJSONComponent } from '../../components/clinical-json/clinical-json.component';

@Component({
    selector: 'app-consultation-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        PatientHeaderComponent,
        SOAPCardsComponent,
        DocumentsPanelComponent,
        ClinicalJSONComponent
    ],
    templateUrl: './consultation-detail.component.html',
    styleUrl: './consultation-detail.component.scss'
})
export class ConsultationDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private http = inject(HttpClient);

    consultationId: string | null = null;
    data: any = null;
    loading = true;
    error = '';

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.consultationId = params.get('id');
            if (this.consultationId) {
                this.loadConsultation();
            }
        });
    }

    loadConsultation(): void {
        this.loading = true;
        this.error = '';

        this.http.get<any>(`/api/consultations/${this.consultationId}`).subscribe({
            next: (res) => {
                if (res.status === 'success') {
                    this.data = this.transformData(res.data);
                } else {
                    this.error = 'Erro ao carregar consulta.';
                }
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.error = `Erro ${err.status}: ${err.statusText}`;
                this.loading = false;
            }
        });
    }

    // Transform backend API format to match frontend components expectation
    private transformData(backendData: any): any {
        return {
            patient: {
                iniciais: backendData.iniciais,
                paciente_id: backendData.paciente_id,
                idade: backendData.idade,
                cenario_atendimento: backendData.cenario_atendimento
            },
            soap: backendData.soap,
            clinicalData: backendData.clinicalData,
            jsonUniversal: backendData.jsonUniversal,
            documents: backendData.documents
        };
    }
}

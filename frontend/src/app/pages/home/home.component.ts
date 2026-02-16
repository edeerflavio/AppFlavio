import { Component, inject } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { HeaderComponent } from '../../components/header/header.component';
import { InputFormComponent } from '../../components/input-form/input-form.component';
import { PatientHeaderComponent } from '../../components/patient-header/patient-header.component';
import { SOAPCardsComponent } from '../../components/soap-cards/soap-cards.component';
import { ClinicalJSONComponent } from '../../components/clinical-json/clinical-json.component';
import { DialogPanelComponent } from '../../components/dialog-panel/dialog-panel.component';
import { DocumentsPanelComponent } from '../../components/documents-panel/documents-panel.component';

import { ScribeService, AnalyzePayload } from '../../services/scribe.service';
import { AnalyzeResponse } from '../../models/analyze.model';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule, JsonPipe,
        HeaderComponent,
        InputFormComponent,
        PatientHeaderComponent,
        SOAPCardsComponent,
        ClinicalJSONComponent,
        DialogPanelComponent,
        DocumentsPanelComponent
    ],
    templateUrl: './home.component.html'
})
export class HomeComponent {
    private scribeService = inject(ScribeService);

    // ── State ──
    nomeCompleto = '';
    idade = 0;
    cenarioAtendimento = 'PS';
    textoTranscrito = '';

    gravando = false;
    processando = false;
    tempoGravacao = 0;
    erro = '';

    resultado: AnalyzeResponse | null = null;
    currentYear = new Date().getFullYear();

    private gravacaoInterval: any = null;

    // ══════════════════════════════════════════════════════════════
    // Actions
    // ══════════════════════════════════════════════════════════════

    onGravar(): void {
        if (this.gravando) {
            // Stop recording
            this.gravando = false;
            clearInterval(this.gravacaoInterval);

            if (!this.textoTranscrito.trim()) {
                this.textoTranscrito = this.getSimulatedTranscript();
            }
        } else {
            // Start recording
            this.gravando = true;
            this.tempoGravacao = 0;
            this.gravacaoInterval = setInterval(() => {
                this.tempoGravacao++;
            }, 1000);
        }
    }

    onAnalisar(): void {
        if (!this.textoTranscrito.trim()) return;

        this.processando = true;
        this.erro = '';
        this.resultado = null;

        const payload: AnalyzePayload = {
            nome_completo: this.nomeCompleto || 'Paciente Anônimo',
            idade: this.idade || 0,
            cenario_atendimento: this.cenarioAtendimento,
            texto_transcrito: this.textoTranscrito,
        };

        this.scribeService.analyzeText(payload).subscribe({
            next: (res) => {
                this.processando = false;
                this.resultado = res;
            },
            error: (err: HttpErrorResponse) => {
                this.processando = false;
                this.erro = err.error?.detail
                    || err.error?.message
                    || `Erro ${err.status}: ${err.statusText}`;
                console.error('Analyze error:', err);
            },
        });
    }

    onLimpar(): void {
        this.resultado = null;
        this.erro = '';
    }

    private getSimulatedTranscript(): string {
        return 'Médico: Bom dia, como está se sentindo?\n' +
            'Paciente: Doutor, estou com dor de cabeça forte há 3 dias, não passa com nada.\n' +
            'Médico: Entendi. Vou verificar seus sinais vitais. PA 150 por 95, frequência cardíaca 92, ' +
            'saturação 97%, temperatura 37.2 graus.\n' +
            'Paciente: Também tenho diabetes e tomo metformina. Tenho alergia a DIPIRONA.\n' +
            'Médico: Certo. Vou solicitar alguns exames e iniciar o tratamento para a cefaleia.\n' +
            'Paciente: Obrigado doutor.';
    }
}

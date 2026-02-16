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
import { AudioRecorderService } from '../../services/audio-recorder.service';
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
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
    private scribeService = inject(ScribeService);
    private audioRecorder = inject(AudioRecorderService);

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

    async onGravar(): Promise<void> {
        if (this.gravando) {
            // Stop recording
            this.gravando = false;
            clearInterval(this.gravacaoInterval);

            try {
                this.processando = true; // Show spinner while transcribing
                const audioBlob = await this.audioRecorder.stopRecording();

                this.scribeService.transcribeAudio(audioBlob).subscribe({
                    next: (res) => {
                        this.processando = false;
                        // Append or set text
                        const current = this.textoTranscrito ? this.textoTranscrito + '\n\n' : '';
                        this.textoTranscrito = current + res.text;
                    },
                    error: (err) => {
                        this.processando = false;
                        this.erro = 'Erro na transcrição: ' + (err.error?.detail || err.message);
                        console.error(err);
                    }
                });
            } catch (err) {
                this.processando = false;
                this.erro = 'Erro ao processar áudio';
                console.error(err);
            }

        } else {
            // Start recording
            try {
                this.erro = '';
                await this.audioRecorder.startRecording();
                this.gravando = true;
                this.tempoGravacao = 0;
                this.gravacaoInterval = setInterval(() => {
                    this.tempoGravacao++;
                }, 1000);
            } catch (err) {
                this.erro = 'Não foi possível acessar o microfone.';
                console.error(err);
            }
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

}

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { InputFormComponent } from '../../components/input-form/input-form.component';
import { PatientHeaderComponent } from '../../components/patient-header/patient-header.component';
import { SOAPCardsComponent } from '../../components/soap-cards/soap-cards.component';
import { ClinicalJSONComponent } from '../../components/clinical-json/clinical-json.component';
import { DialogPanelComponent } from '../../components/dialog-panel/dialog-panel.component';
import { DocumentsPanelComponent } from '../../components/documents-panel/documents-panel.component';

import { ScribeService, AnalyzePayload } from '../../services/scribe.service';
import { AudioRecorderService } from '../../services/audio-recorder.service';
import { ClinicalInsightsService, SystematizationResponse } from '../../services/clinical-insights.service';
import { PhysicianProfileService } from '../../services/physician-profile.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { AnalyzeResponse } from '../../models/analyze.model';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
export class HomeComponent implements OnInit, OnDestroy {
    private scribeService = inject(ScribeService);
    private audioRecorder = inject(AudioRecorderService);
    private clinicalInsightsService = inject(ClinicalInsightsService);
    private profileService = inject(PhysicianProfileService);
    private pdfService = inject(PdfGeneratorService);
    private router = inject(Router);

    // -- App Modes --
    exibindoSistematizacao = false; // Toggle between recording and closure view
    abaAtiva = 'prontuario'; // Active tab in closure view

    // -- Systematic Result --
    systematicResult?: SystematizationResponse;
    isSystematizing = false;

    // -- Reactive state --
    private textChangeSubject = new Subject<string>();
    private insightsSubscription?: Subscription;

    // ── State ──
    nomeCompleto = '';
    idade = 0;
    cenarioAtendimento = 'PS';
    textoTranscrito = '';

    gravando = false;
    processando = false;
    tempoGravacao = 0;
    erro = '';

    // -- Copilot State --
    isLoadingCopiloto = false;
    analiseClinica = '';
    contextoCopiloto = 'Consultório';
    erroCopiloto: string | null = null;

    resultado: AnalyzeResponse | null = null;
    currentYear = new Date().getFullYear();

    // -- Audio & Interval --
    private gravacaoInterval: any = null;
    private continuousInterval: any = null;

    ngOnInit(): void {
        this.insightsSubscription = this.textChangeSubject.pipe(
            debounceTime(3500),
            distinctUntilChanged()
        ).subscribe(texto => {
            if (texto.trim().length > 10) {
                this.gerarInsightsEmTempoReal(texto);
            }
        });
    }

    ngOnDestroy(): void {
        this.insightsSubscription?.unsubscribe();
        if (this.gravacaoInterval) clearInterval(this.gravacaoInterval);
    }

    onTextoChange(novoTexto: string): void {
        this.textoTranscrito = novoTexto;
        this.textChangeSubject.next(novoTexto);
    }

    // ══════════════════════════════════════════════════════════════
    // Actions
    // ══════════════════════════════════════════════════════════════

    async onGravar(): Promise<void> {
        if (this.gravando) {
            this.pararGravacaoContinua();
        } else {
            await this.iniciarGravacaoContinua();
        }
    }

    private async iniciarGravacaoContinua(): Promise<void> {
        try {
            this.erro = '';
            await this.audioRecorder.startRecording();
            this.gravando = true;
            this.tempoGravacao = 0;

            // UI Timer
            this.gravacaoInterval = setInterval(() => {
                this.tempoGravacao++;
            }, 1000);

            // Pseudo-streaming loop every 5 seconds
            this.continuousInterval = setInterval(() => {
                this.processarBlocoAudio();
            }, 5000);

        } catch (err) {
            this.erro = 'Não foi possível acessar o microfone.';
            console.error(err);
        }
    }

    private pararGravacaoContinua(): void {
        this.gravando = false;
        clearInterval(this.gravacaoInterval);
        clearInterval(this.continuousInterval);
        this.processarBlocoAudio(true); // Final processing
    }

    private async processarBlocoAudio(isFinal = false): Promise<void> {
        if (!this.gravando && !isFinal) return;

        try {
            const audioBlob = await this.audioRecorder.stopRecording();

            // Restart immediately if not final
            if (!isFinal && this.gravando) {
                await this.audioRecorder.startRecording();
            }

            if (audioBlob.size > 0) {
                this.processando = true;
                this.scribeService.transcribeAudio(audioBlob).subscribe({
                    next: (res: { text: string }) => {
                        this.processando = false;
                        if (res.text.trim()) {
                            const current = this.textoTranscrito ? this.textoTranscrito + ' ' : '';
                            this.onTextoChange(current + res.text);
                        }
                    },
                    error: (err: any) => {
                        this.processando = false;
                        console.error('Transcription error during streaming:', err);
                    }
                });
            }
        } catch (err) {
            this.processando = false;
            console.error('Error processing audio block:', err);
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
                if (res.success && res.consultation_id) {
                    this.router.navigate(['/consultation', res.consultation_id]);
                } else {
                    this.erro = 'Análise concluída, mas sem ID de consulta.';
                }
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

    gerarInsightsEmTempoReal(texto: string): void {
        this.isLoadingCopiloto = true;
        this.erroCopiloto = null;

        this.clinicalInsightsService.getInsights(texto, this.contextoCopiloto).subscribe({
            next: (res) => {
                this.isLoadingCopiloto = false;
                this.analiseClinica = res.analise_clinica;
                this.erroCopiloto = null;
            },
            error: (err) => {
                this.isLoadingCopiloto = false;
                this.analiseClinica = '';
                this.erroCopiloto = 'Não foi possível gerar os insights clínicos no momento. Verifique a conexão ou a chave da API.';
                console.error('Real-time copilot error:', err);
            }
        });
    }

    onLimpar(): void {
        this.resultado = null;
        this.erro = '';
        this.textoTranscrito = '';
        this.nomeCompleto = '';
        this.idade = 0;
        this.cenarioAtendimento = 'PS';
    }

    private parseTranscriptionError(err: any): string {
        const status = err.status || err.error?.status;
        const detail = err.error?.detail || '';

        switch (status) {
            case 401:
                return 'Modelo de IA indisponível — API Key inválida. Acesse Configurações para corrigir.';
            case 429:
                return 'Limite de requisições atingido. Aguarde alguns instantes e tente novamente.';
            case 503:
                return 'Serviço de IA indisponível. Verifique suas configurações ou tente mais tarde.';
            default:
                return detail || 'Erro na transcrição. Verifique suas configurações de IA.';
        }
    }

    finalizarAtendimento(): void {
        const textoParaSistematizar = this.textoTranscrito;
        if (!textoParaSistematizar.trim()) return;

        this.isSystematizing = true;
        this.clinicalInsightsService.sistematizarConsulta(textoParaSistematizar, this.contextoCopiloto).subscribe({
            next: (res) => {
                this.isSystematizing = false;
                this.systematicResult = res;
                this.exibindoSistematizacao = true;
                this.abaAtiva = 'prontuario';
            },
            error: (err: any) => {
                this.isSystematizing = false;
                console.error('Systematization error:', err);
                alert('Erro ao sistematizar atendimento. Verifique sua chave OpenAI no backend.');
            }
        });
    }

    setAba(aba: string): void {
        this.abaAtiva = aba;
    }

    copiarProntuario(): void {
        if (this.systematicResult?.prontuario) {
            navigator.clipboard.writeText(this.systematicResult.prontuario);
            alert('Prontuário copiado para a área de transferência!');
        }
    }

    voltarParaGravacao(): void {
        this.exibindoSistematizacao = false;
    }

    gerarPDF(tipo: string): void {
        const content = this.systematicResult ? (this.systematicResult as any)[tipo] : '';
        if (content) {
            this.pdfService.generateClinicalPdf(tipo, content);
        } else {
            alert('Não há conteúdo para gerar o PDF.');
        }
    }
}

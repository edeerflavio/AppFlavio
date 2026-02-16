import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="input-card" [class.recording]="gravando">
      <h2>📝 Entrada Clínica</h2>

      <!-- Patient Info Row -->
      <div class="input-row">
        <div class="input-group">
          <label for="nome">Nome Completo</label>
          <input id="nome" type="text" [(ngModel)]="nomeCompleto" (ngModelChange)="nomeCompletoChange.emit($event)"
                 placeholder="Ex: João Oliveira Silva" />
        </div>
        <div class="input-group input-small">
          <label for="idade">Idade</label>
          <input id="idade" type="number" [(ngModel)]="idade" (ngModelChange)="idadeChange.emit($event)"
                 min="0" max="150" />
        </div>
        <div class="input-group">
          <label for="cenario">Cenário</label>
          <select id="cenario" [(ngModel)]="cenarioAtendimento" (ngModelChange)="cenarioAtendimentoChange.emit($event)">
            <option value="UBS">UBS</option>
            <option value="PS">PS</option>
            <option value="UTI">UTI</option>
            <option value="Consultório">Consultório</option>
          </select>
        </div>
      </div>

      <!-- Transcription Textarea -->
      <div class="input-group full-width">
        <label for="transcricao">Transcrição / Texto Clínico</label>
        <textarea id="transcricao" rows="6"
                  [(ngModel)]="textoTranscrito" (ngModelChange)="textoTranscritoChange.emit($event)"
                  placeholder="Cole a transcrição aqui ou use o botão Gravar..."
                  [disabled]="gravando"></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="actions-row">
        <button class="btn btn-record" (click)="onGravar()" [class.active]="gravando">
          <span class="rec-dot" *ngIf="gravando"></span>
          {{ gravando ? '⏹ Parar Gravação' : '🎙️ Gravar' }}
        </button>

        <button class="btn btn-primary" (click)="onAnalisar()"
                [disabled]="processando || !textoTranscrito.trim()">
          <span class="spinner" *ngIf="processando"></span>
          {{ processando ? 'Processando...' : '🧠 Analisar SOAP' }}
        </button>

        <button class="btn btn-ghost" (click)="onLimpar()" *ngIf="hasResult">
          🗑️ Limpar
        </button>
      </div>

      <!-- Simulated Recording Timer -->
      <div class="recording-timer" *ngIf="gravando">
        <span class="rec-indicator">●</span>
        Gravando... {{ tempoGravacao }}s
      </div>
    </section>
  `,
  styles: [`
    .input-card {
      background: #1E293B;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
      border: 1px solid rgba(255,255,255,0.06);
      transition: border-color 250ms ease;
    }
    .input-card.recording { border-color: rgba(239, 68, 68, 0.4); }
    h2 { margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; color: #E2E8F0; }

    .input-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-bottom: 16px;
    }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group.full-width { margin-bottom: 16px; }
    label {
      font-size: 0.8rem; font-weight: 600; color: #94A3B8;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    input, select, textarea {
      background: #0F172A; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; color: #E2E8F0; padding: 10px 14px;
      font-size: 0.95rem; font-family: inherit; transition: border-color 200ms ease;
      outline: none; width: 100%;
    }
    input:focus, select:focus, textarea:focus {
      border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    textarea { resize: vertical; line-height: 1.6; }

    .actions-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px;
      border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 600;
      font-family: inherit; cursor: pointer; transition: all 200ms ease;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; }
    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3); transform: translateY(-1px);
    }
    .btn-record { background: #1E293B; color: #E2E8F0; border: 1px solid rgba(255,255,255,0.1); }
    .btn-record:hover { border-color: #EF4444; color: #EF4444; }
    .btn-record.active {
      background: rgba(239, 68, 68, 0.1); border-color: #EF4444; color: #EF4444;
      animation: recordPulse 1.5s infinite;
    }
    .rec-dot { width: 8px; height: 8px; background: #EF4444; border-radius: 50%; animation: pulse 1s infinite; }
    .btn-ghost { background: transparent; color: #94A3B8; border: 1px solid transparent; }
    .btn-ghost:hover { color: #E2E8F0; border-color: rgba(255,255,255,0.1); }
    
    .spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
    }

    .recording-timer {
      margin-top: 12px; display: flex; align-items: center; gap: 8px;
      color: #EF4444; font-size: 0.9rem; font-weight: 600;
    }
    .rec-indicator { font-size: 1.2rem; animation: pulse 1s infinite; }

    /* Animations */
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes recordPulse {
      0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
      70% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
      100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
    }

    @media (max-width: 768px) {
      .input-row { grid-template-columns: 1fr; }
    }
  `]
})
export class InputFormComponent {
  @Input() nomeCompleto = '';
  @Output() nomeCompletoChange = new EventEmitter<string>();

  @Input() idade = 0;
  @Output() idadeChange = new EventEmitter<number>();

  @Input() cenarioAtendimento = 'PS';
  @Output() cenarioAtendimentoChange = new EventEmitter<string>();

  @Input() textoTranscrito = '';
  @Output() textoTranscritoChange = new EventEmitter<string>();

  @Input() gravando = false;
  @Input() processando = false;
  @Input() tempoGravacao = 0;
  @Input() hasResult = false;

  @Output() gravar = new EventEmitter<void>();
  @Output() analisar = new EventEmitter<void>();
  @Output() limpar = new EventEmitter<void>();

  onGravar() { this.gravar.emit(); }
  onAnalisar() { this.analisar.emit(); }
  onLimpar() { this.limpar.emit(); }
}

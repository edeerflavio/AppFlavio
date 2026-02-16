import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogEntry } from '../../models/analyze.model';

@Component({
    selector: 'app-dialog-panel',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="dialog-section" *ngIf="dialog && dialog.length > 0">
      <h3>🎙️ Diarização
        <span class="dialog-meta" *ngIf="stats">
          ({{ stats.total_falas }} falas:
          {{ stats.falas_medico }} médico,
          {{ stats.falas_paciente }} paciente)
        </span>
      </h3>
      <div class="dialog-entries">
        <div *ngFor="let d of dialog.slice(0, 12)" class="dialog-bubble" [ngClass]="'bubble-' + d.speaker">
          <span class="speaker-tag">
            {{ d.speaker === 'medico' ? '👨‍⚕️ Médico' : '🧑‍🦱 Paciente' }}
          </span>
          <p>{{ d.text }}</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .dialog-section {
      background: #1E293B; border-radius: 14px; padding: 24px; margin-bottom: 24px;
    }
    h3 { margin: 0 0 14px; color: #E2E8F0; font-size: 1rem; }
    .dialog-meta { font-size: 0.85rem; color: #94A3B8; font-weight: 400; }
    .dialog-entries { display: flex; flex-direction: column; gap: 8px; }
    .dialog-bubble {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px;
      border-radius: 10px; background: rgba(255,255,255,0.02);
    }
    .bubble-medico { border-left: 3px solid #2563EB; }
    .bubble-paciente { border-left: 3px solid #06D6A0; }
    .speaker-tag {
      white-space: nowrap; font-size: 0.8rem; font-weight: 600; color: #94A3B8; min-width: 100px;
    }
    p { margin: 0; color: #CBD5E1; font-size: 0.9rem; line-height: 1.5; }
  `]
})
export class DialogPanelComponent {
    @Input() dialog: DialogEntry[] | undefined = [];
    @Input() stats: { total_falas: number; falas_medico: number; falas_paciente: number } | undefined;
}

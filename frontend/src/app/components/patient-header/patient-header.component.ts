import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzeResponse } from '../../models/analyze.model';

@Component({
  selector: 'app-patient-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="patient-header" *ngIf="patient">
      <div class="patient-info">
        <span class="patient-initials">{{ patient?.iniciais }}</span>
        <span class="patient-age">{{ patient?.idade }} anos</span>
        <span class="cenario-chip" [ngClass]="'chip-' + (patient?.cenario_atendimento | lowercase)">
          {{ patient?.cenario_atendimento }}
        </span>
        <span class="lgpd-chip">🔒 LGPD</span>
      </div>
      <div class="patient-meta" *ngIf="clinicalData">
        <span>CID: <strong>{{ clinicalData?.cid_principal?.code }}</strong>
              — {{ clinicalData?.cid_principal?.desc }}</span>
        <span>Gravidade:
          <strong [ngClass]="getGravClass(clinicalData?.gravidade)">
            {{ clinicalData?.gravidade }}
          </strong>
        </span>
      </div>
    </section>
  `,
  styles: [`
    .patient-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; background: linear-gradient(135deg, #1E293B, #0F172A);
      border-radius: 14px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .patient-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .patient-initials { font-size: 1.3rem; font-weight: 800; color: #2563EB; }
    .patient-age { color: #94A3B8; font-size: 0.95rem; }
    .cenario-chip {
      padding: 3px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
      text-transform: uppercase;
    }
    .chip-ubs { background: rgba(6,214,160,0.15); color: #06D6A0; }
    .chip-ps { background: rgba(245,158,11,0.15); color: #F59E0B; }
    .chip-uti { background: rgba(239,68,68,0.15); color: #EF4444; }
    .chip-consultório { background: rgba(37,99,235,0.15); color: #2563EB; }
    .lgpd-chip {
      font-size: 0.75rem; color: #06D6A0; padding: 3px 10px;
      background: rgba(6,214,160,0.1); border-radius: 20px; font-weight: 600;
    }
    .patient-meta {
      display: flex; gap: 20px; color: #94A3B8; font-size: 0.9rem; flex-wrap: wrap;
    }
    .grav-leve { color: #06D6A0; }
    .grav-moderada { color: #F59E0B; }
    .grav-grave { color: #EF4444; }

    @media (max-width: 768px) {
      .patient-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class PatientHeaderComponent {
  @Input() patient: any = null;
  @Input() clinicalData: any = null;

  getGravClass(grav: string | undefined): string {
    if (!grav) return '';
    if (grav === 'Grave') return 'grav-grave';
    if (grav === 'Moderada') return 'grav-moderada';
    return 'grav-leve';
  }
}

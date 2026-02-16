import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SinaisVitais } from '../../models/analyze.model';

interface VitalRow {
    icon: string;
    label: string;
    value: string;
    ref: string;
    danger: boolean;
}

@Component({
    selector: 'app-vitals-table',
    standalone: true,
    imports: [CommonModule],
    template: `
    <table class="vitals-table" *ngIf="vitalRows.length > 0">
      <thead>
        <tr><th>Parâmetro</th><th>Valor</th><th>Ref.</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let v of vitalRows">
          <td>{{ v.icon }} {{ v.label }}</td>
          <td [class.vital-danger]="v.danger">{{ v.value }}</td>
          <td class="ref-col">{{ v.ref }}</td>
        </tr>
      </tbody>
    </table>
  `,
    styles: [`
    .vitals-table {
      width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 0.85rem;
    }
    th, td {
      padding: 8px 10px; text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.04); color: #CBD5E1;
    }
    thead th {
      color: #94A3B8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    }
    .ref-col { color: #64748B; font-size: 0.8rem; }
    .vital-danger {
      color: #EF4444 !important; font-weight: 700;
      background: rgba(239, 68, 68, 0.1); border-radius: 4px; padding: 2px 6px;
    }
  `]
})
export class VitalsTableComponent implements OnChanges {
    @Input() sinaisVitais: SinaisVitais | undefined | null = null;
    vitalRows: VitalRow[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['sinaisVitais']) {
            this.buildVitalRows();
        }
    }

    private buildVitalRows(): void {
        this.vitalRows = [];
        const sv = this.sinaisVitais;
        if (!sv) return;

        const abnormal = (val: number | undefined | null, lo: number, hi: number): boolean =>
            val != null && (val < lo || val > hi);

        if (sv.pa) {
            const danger = abnormal(sv.pa.sistolica, 90, 140) || abnormal(sv.pa.diastolica, 60, 90);
            this.vitalRows.push({
                icon: '🫀', label: 'PA',
                value: `${sv.pa.sistolica}x${sv.pa.diastolica} mmHg`,
                ref: '90-140 / 60-90', danger,
            });
        }
        if (sv.fc) {
            this.vitalRows.push({
                icon: '💓', label: 'FC',
                value: `${sv.fc.valor} bpm`,
                ref: '50-100', danger: abnormal(sv.fc.valor, 50, 100),
            });
        }
        if (sv.fr) {
            this.vitalRows.push({
                icon: '🌬️', label: 'FR',
                value: `${sv.fr.valor} irpm`,
                ref: '12-22', danger: abnormal(sv.fr.valor, 12, 22),
            });
        }
        if (sv.sato2) {
            this.vitalRows.push({
                icon: '🩸', label: 'SpO2',
                value: `${sv.sato2.valor}%`,
                ref: '≥ 94%', danger: (sv.sato2.valor ?? 100) < 94,
            });
        }
        if (sv.temperatura) {
            this.vitalRows.push({
                icon: '🌡️', label: 'Temp',
                value: `${sv.temperatura.valor}°C`,
                ref: '35.5-37.8', danger: abnormal(sv.temperatura.valor, 35.5, 37.8),
            });
        }
    }
}

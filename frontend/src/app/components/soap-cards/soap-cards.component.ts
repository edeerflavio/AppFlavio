import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SOAPSection } from '../../models/analyze.model';
import { VitalsTableComponent } from '../vitals-table/vitals-table.component';

@Component({
    selector: 'app-soap-cards',
    standalone: true,
    imports: [CommonModule, VitalsTableComponent],
    template: `
    <div class="soap-grid" *ngIf="soapEntries.length > 0">
      <div *ngFor="let entry of soapEntries" class="soap-card" [ngClass]="'soap-' + entry.key">
        <div class="soap-card-head">
          <span class="soap-icon">{{ entry.section.icon }}</span>
          <h3>{{ entry.section.title }}</h3>
        </div>
        <div class="soap-card-body">
          <p class="soap-text">{{ entry.section.content }}</p>

          <!-- Vitals in Objective -->
          <app-vitals-table
            *ngIf="entry.key === 'objetivo'"
            [sinaisVitais]="entry.section.sinais_vitais">
          </app-vitals-table>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .soap-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .soap-card {
      background: #1E293B; border-radius: 14px; overflow: hidden;
      border-left: 4px solid #2563EB; animation: fadeInUp 400ms ease;
    }
    .soap-subjetivo { border-left-color: #06D6A0; }
    .soap-objetivo { border-left-color: #2563EB; }
    .soap-avaliacao { border-left-color: #F59E0B; }
    .soap-plano { border-left-color: #8B5CF6; }

    .soap-card-head {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .soap-icon { font-size: 1.2rem; }
    h3 { font-size: 0.9rem; font-weight: 600; color: #E2E8F0; margin: 0; }

    .soap-card-body { padding: 14px 16px; }
    .soap-text {
      color: #CBD5E1; font-size: 0.9rem; line-height: 1.7; margin: 0; white-space: pre-wrap;
    }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SOAPCardsComponent implements OnChanges {
    @Input() soap: Record<string, SOAPSection> | undefined | null = null;
    soapEntries: { key: string; section: SOAPSection }[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['soap']) {
            this.soapEntries = this.soap
                ? Object.entries(this.soap)
                    // Sort S-O-A-P just in case
                    .sort((a, b) => {
                        const order = ['subjetivo', 'objetivo', 'avaliacao', 'plano'];
                        return order.indexOf(a[0]) - order.indexOf(b[0]);
                    })
                    .map(([key, section]) => ({ key, section }))
                : [];
        }
    }
}

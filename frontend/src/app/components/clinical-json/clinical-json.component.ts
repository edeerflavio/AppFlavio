import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clinical-json',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="json-card" *ngIf="jsonUniversal">
      <h3>📊 JSON Clínico Universal</h3>
      <div class="json-grid">
        <div class="json-item">
          <label>HDA Técnica</label>
          <p>{{ jsonUniversal['HDA_Tecnica'] || 'N/D' }}</p>
        </div>
        <div class="json-item">
          <label>Comorbidades</label>
          <p>{{ joinOrDefault(jsonUniversal['Comorbidades'], 'Nenhuma') }}</p>
        </div>
        <div class="json-item alert-item">
          <label>⚠️ Alergias</label>
          <p class="text-danger">{{ joinOrDefault(jsonUniversal['Alergias'], 'NKDA') }}</p>
        </div>
        <div class="json-item">
          <label>Medicações Atuais</label>
          <p>{{ joinOrDefault(jsonUniversal['Medicações_Atuais'], 'Nenhuma') }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .json-card {
      background: #1E293B; border-radius: 14px; padding: 24px; margin-bottom: 24px;
    }
    h3 { margin: 0 0 16px; color: #E2E8F0; font-size: 1rem; }
    .json-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;
    }
    .json-item label {
      display: block; font-size: 0.75rem; font-weight: 600; color: #94A3B8;
      text-transform: uppercase; margin-bottom: 4px;
    }
    .json-item p { margin: 0; color: #CBD5E1; font-size: 0.9rem; }
    .alert-item {
      background: rgba(239,68,68,0.06); border-radius: 10px; padding: 10px 14px;
    }
    .text-danger { color: #EF4444; font-weight: 600; }
  `]
})
export class ClinicalJSONComponent {
  @Input() jsonUniversal: Record<string, any> | undefined | null = null;
  @Input() clinicalData: any = null; // Kept for interface compatibility with Home

  joinOrDefault(arr: string[] | undefined | null, fallback: string): string {
    return arr && arr.length > 0 ? arr.join(', ') : fallback;
  }
}

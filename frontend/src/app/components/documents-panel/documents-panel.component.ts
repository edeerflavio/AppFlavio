import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-documents-panel',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="docs-section" *ngIf="docEntries.length > 0">
      <h3>📄 Documentos Gerados</h3>
      <div class="docs-grid">
        <div *ngFor="let doc of docEntries" class="doc-card">
          <div class="doc-header">
            <span class="doc-icon">{{ getDocIcon(doc.key) }}</span>
            <h4>{{ doc.value.title }}</h4>
            <span class="doc-status" [class.validated]="doc.value.validated">
              {{ doc.value.validated ? '✅ Validado' : '⏳ Pendente' }}
            </span>
          </div>
          <pre class="doc-content">{{ doc.value.content }}</pre>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .docs-section {
      background: #1E293B; border-radius: 14px; padding: 24px; margin-bottom: 24px;
    }
    h3 { margin: 0 0 16px; color: #E2E8F0; font-size: 1rem; }
    .docs-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;
    }
    .doc-card { background: #0F172A; border-radius: 12px; overflow: hidden; }
    .doc-header {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .doc-icon { font-size: 1.1rem; }
    h4 { flex: 1; margin: 0; font-size: 0.85rem; color: #E2E8F0; }
    .doc-status { font-size: 0.75rem; font-weight: 600; color: #F59E0B; }
    .doc-status.validated { color: #06D6A0; }
    .doc-content {
      padding: 14px 16px; font-size: 0.8rem; color: #94A3B8; white-space: pre-wrap;
      line-height: 1.5; max-height: 180px; overflow-y: auto; margin: 0;
      font-family: 'Inter', sans-serif;
    }
  `]
})
export class DocumentsPanelComponent implements OnChanges {
    @Input() documents: Record<string, any> | undefined | null = null;
    docEntries: { key: string; value: any }[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['documents']) {
            this.docEntries = this.documents
                ? Object.entries(this.documents).map(([key, value]) => ({ key, value }))
                : [];
        }
    }

    getDocIcon(type: string): string {
        const icons: Record<string, string> = {
            prescription: '💊',
            attestation: '📋',
            exam_request: '🔬',
            patient_guide: '📖',
        };
        return icons[type] || '📄';
    }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <header class="app-header">
      <div class="header-left">
        <span class="logo-icon">🩺</span>
        <h1>Medical Scribe<span class="version-badge">Enterprise v3</span></h1>
      </div>
      <div class="header-right">
        <span class="lgpd-tag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          LGPD
        </span>
        <span class="status-dot" [class.online]="online"></span>
      </div>
    </header>
  `,
    styles: [`
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .logo-icon { font-size: 1.6rem; }
    h1 { font-size: 1.3rem; font-weight: 700; color: #E2E8F0; margin: 0; }
    .version-badge {
      font-size: 0.65rem; font-weight: 600;
      background: rgba(37, 99, 235, 0.2); color: #60A5FA;
      padding: 2px 8px; border-radius: 20px; margin-left: 8px;
      vertical-align: middle;
    }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .lgpd-tag {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; background: rgba(6, 214, 160, 0.12);
      color: #06D6A0; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      border: 1px solid rgba(6, 214, 160, 0.2);
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #EF4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      transition: all 0.3s ease;
    }
    .status-dot.online {
      background: #06D6A0;
      box-shadow: 0 0 8px rgba(6, 214, 160, 0.4);
    }
    @media (max-width: 768px) {
      .app-header { padding: 12px 16px; }
      h1 { font-size: 1.1rem; }
    }
  `]
})
export class HeaderComponent {
    @Input() online = false;
}

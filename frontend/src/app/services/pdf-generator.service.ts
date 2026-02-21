import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { PhysicianProfileService } from './physician-profile.service';

@Injectable({
    providedIn: 'root'
})
export class PdfGeneratorService {
    private profileService = inject(PhysicianProfileService);

    generateClinicalPdf(title: string, content: string): void {
        const profile = this.profileService.getProfile();
        const doc = new jsPDF();
        const margin = 20;
        let y = 20;

        // --- Header ---
        if (profile.logoUrl) {
            try {
                doc.addImage(profile.logoUrl, 'PNG', margin, y, 30, 30);
                y += 15;
            } catch (e) {
                console.error('Error adding logo to PDF', e);
            }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(profile.nome || 'Médico Assistente', profile.logoUrl ? 60 : margin, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);

        let subHeaderY = y + 10;
        if (profile.especialidade) {
            doc.text(profile.especialidade, profile.logoUrl ? 60 : margin, subHeaderY);
            subHeaderY += 5;
        }

        const crmRqe = [];
        if (profile.crm) crmRqe.push(`CRM: ${profile.crm}`);
        if (profile.rqe) crmRqe.push(`RQE: ${profile.rqe}`);

        if (crmRqe.length > 0) {
            doc.text(crmRqe.join(' | '), profile.logoUrl ? 60 : margin, subHeaderY);
        }

        y += profile.logoUrl ? 35 : 25;

        // --- Divider ---
        doc.setDrawColor(200);
        doc.line(margin, y, 210 - margin, y);
        y += 10;

        // --- Automatic Date (Standard Brazilian Format) ---
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Data: ${dataAtual}`, 210 - margin, y, { align: 'right' });
        y += 10;

        // --- Title ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(title.toUpperCase(), 105, y, { align: 'center' });
        y += 15;

        // --- Content ---
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(50);

        const splitContent = doc.splitTextToSize(content, 210 - (margin * 2));
        const lineHeight = 7;

        // Render content and update Y
        doc.text(splitContent, margin, y);
        y += (splitContent.length * lineHeight);

        // --- Signature & Stamp Block (Legal Validity) ---
        const spaceRemaining = 297 - y; // A4 height is 297mm
        const signatureBlockHeight = 40;

        // Check if we need a new page for the signature
        if (spaceRemaining < (signatureBlockHeight + 30)) {
            doc.addPage();
            y = 30; // Start at top of new page
        } else {
            y += 30; // Vertical margin separator
        }

        // Render Signature Block
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(0);

        const centerX = 105;
        doc.text('________________________________________________', centerX, y, { align: 'center' });
        y += 7;

        doc.setFont('helvetica', 'bold');
        doc.text(profile.nome || 'Médico Assistente', centerX, y, { align: 'center' });
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const crmStr = profile.crm ? `CRM: ${profile.crm}` : '';
        const rqeStr = profile.rqe ? ` | RQE: ${profile.rqe}` : '';
        if (crmStr || rqeStr) {
            doc.text(`${crmStr}${rqeStr}`, centerX, y, { align: 'center' });
            y += 5;
        }

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('(Assinatura e Carimbo)', centerX, y, { align: 'center' });

        // --- Footer (System Info) ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150);
        const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`Gerado por Medical Scribe em ${dateStr}`, 105, pageHeight - 10, { align: 'center' });

        // Save
        const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
        doc.save(filename);
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    doctorName = '';
    saved = false;

    ngOnInit(): void {
        const stored = localStorage.getItem('scribe_doctor_name');
        if (stored) {
            this.doctorName = stored;
        }
    }

    saveSettings(): void {
        if (this.doctorName.trim()) {
            localStorage.setItem('scribe_doctor_name', this.doctorName.trim());
        } else {
            localStorage.removeItem('scribe_doctor_name');
        }

        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
    }

    resetSettings(): void {
        this.doctorName = '';
        localStorage.removeItem('scribe_doctor_name');
        this.saveSettings();
    }
}

import { Injectable, signal } from '@angular/core';

export interface PhysicianProfile {
    nome: string;
    especialidade: string;
    crm: string;
    rqe: string;
    logoUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PhysicianProfileService {
    private readonly STORAGE_KEY = 'physician_profile';

    // Using signals for reactive state
    profile = signal<PhysicianProfile>(this.loadProfile());

    constructor() { }

    private loadProfile(): PhysicianProfile {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing physician profile', e);
            }
        }
        return {
            nome: '',
            especialidade: '',
            crm: '',
            rqe: ''
        };
    }

    saveProfile(data: PhysicianProfile): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        this.profile.set(data);
    }

    getProfile(): PhysicianProfile {
        return this.profile();
    }
}

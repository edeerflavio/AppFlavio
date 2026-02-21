import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScribeService, LLMSettings, LLMSettingsUpdate, TestConnectionResult } from '../../services/scribe.service';
import { PhysicianProfileService, PhysicianProfile } from '../../services/physician-profile.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    private scribeService = inject(ScribeService);
    private profileService = inject(PhysicianProfileService);

    // ── Doctor Profile ──
    profile: PhysicianProfile = {
        nome: '',
        especialidade: '',
        crm: '',
        rqe: '',
        logoUrl: ''
    };

    // ── LLM Configuration ──
    apiKey = '';
    transcriptionModel = 'whisper-1';
    chatModel = 'gpt-4o-mini';
    provider = 'openai';
    apiKeyMasked = '';
    hasApiKey = false;
    availableTranscriptionModels: string[] = ['whisper-1'];
    availableChatModels: string[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];

    // ── UI State ──
    saved = false;
    saving = false;
    loadingConfig = true;
    testingConnection = false;
    connectionStatus: 'idle' | 'success' | 'error' = 'idle';
    connectionMessage = '';
    errorMessage = '';
    showApiKey = false;

    ngOnInit(): void {
        // Load profile from Service
        this.profile = { ...this.profileService.getProfile() };

        // Load LLM settings from backend
        this.loadLLMSettings();
    }

    onLogoUpload(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.profile.logoUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    loadLLMSettings(): void {
        this.loadingConfig = true;
        this.scribeService.getLLMSettings().subscribe({
            next: (settings: LLMSettings) => {
                this.provider = settings.provider;
                this.apiKeyMasked = settings.api_key_masked;
                this.hasApiKey = settings.has_api_key;
                this.transcriptionModel = settings.transcription_model;
                this.chatModel = settings.chat_model;
                this.availableTranscriptionModels = settings.available_transcription_models;
                this.availableChatModels = settings.available_chat_models;
                this.loadingConfig = false;
            },
            error: (err) => {
                this.loadingConfig = false;
                this.errorMessage = 'Erro ao carregar configurações da IA.';
                console.error('Failed to load LLM settings:', err);
            }
        });
    }

    saveSettings(): void {
        this.saving = true;
        this.errorMessage = '';

        // Save physician profile locally via Service
        this.profileService.saveProfile(this.profile);

        // Save LLM settings to backend
        const update: LLMSettingsUpdate = {
            transcription_model: this.transcriptionModel,
            chat_model: this.chatModel,
            provider: this.provider,
        };

        if (this.apiKey.trim()) {
            update.api_key = this.apiKey.trim();
        }

        this.scribeService.saveLLMSettings(update).subscribe({
            next: (settings: LLMSettings) => {
                this.saving = false;
                this.saved = true;
                this.apiKeyMasked = settings.api_key_masked;
                this.hasApiKey = settings.has_api_key;
                this.apiKey = '';
                this.connectionStatus = 'idle';
                setTimeout(() => this.saved = false, 3000);
            },
            error: (err) => {
                this.saving = false;
                this.errorMessage = 'Erro ao salvar configurações.';
                console.error('Failed to save LLM settings:', err);
            }
        });
    }

    testConnection(): void {
        this.testingConnection = true;
        this.connectionStatus = 'idle';
        this.connectionMessage = '';

        this.scribeService.testLLMConnection().subscribe({
            next: (result: TestConnectionResult) => {
                this.testingConnection = false;
                this.connectionStatus = result.success ? 'success' : 'error';
                this.connectionMessage = result.message;
            },
            error: (err) => {
                this.testingConnection = false;
                this.connectionStatus = 'error';
                this.connectionMessage = 'Erro ao testar conexão com o servidor.';
                console.error('Connection test failed:', err);
            }
        });
    }

    resetSettings(): void {
        if (confirm('Deseja realmente redefinir todas as configurações?')) {
            this.profile = { nome: '', especialidade: '', crm: '', rqe: '', logoUrl: '' };
            this.profileService.saveProfile(this.profile);
            this.apiKey = '';
            this.transcriptionModel = 'whisper-1';
            this.chatModel = 'gpt-4o-mini';
            this.provider = 'openai';
            this.connectionStatus = 'idle';
            this.connectionMessage = '';
        }
    }

    toggleApiKeyVisibility(): void {
        this.showApiKey = !this.showApiKey;
    }
}

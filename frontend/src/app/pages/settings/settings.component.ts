import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScribeService, LLMSettings, LLMSettingsUpdate, TestConnectionResult } from '../../services/scribe.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    private scribeService = inject(ScribeService);

    // ── Doctor Profile ──
    doctorName = '';

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
        // Load doctor name from localStorage
        const stored = localStorage.getItem('scribe_doctor_name');
        if (stored) {
            this.doctorName = stored;
        }

        // Load LLM settings from backend
        this.loadLLMSettings();
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

        // Save doctor name locally
        if (this.doctorName.trim()) {
            localStorage.setItem('scribe_doctor_name', this.doctorName.trim());
        } else {
            localStorage.removeItem('scribe_doctor_name');
        }

        // Save LLM settings to backend
        const update: LLMSettingsUpdate = {
            transcription_model: this.transcriptionModel,
            chat_model: this.chatModel,
            provider: this.provider,
        };

        // Only send api_key if user typed a new one
        if (this.apiKey.trim()) {
            update.api_key = this.apiKey.trim();
        }

        this.scribeService.saveLLMSettings(update).subscribe({
            next: (settings: LLMSettings) => {
                this.saving = false;
                this.saved = true;
                this.apiKeyMasked = settings.api_key_masked;
                this.hasApiKey = settings.has_api_key;
                this.apiKey = ''; // Clear the input after saving
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
        this.doctorName = '';
        this.apiKey = '';
        this.transcriptionModel = 'whisper-1';
        this.chatModel = 'gpt-4o-mini';
        this.provider = 'openai';
        localStorage.removeItem('scribe_doctor_name');
        this.connectionStatus = 'idle';
        this.connectionMessage = '';
    }

    toggleApiKeyVisibility(): void {
        this.showApiKey = !this.showApiKey;
    }
}

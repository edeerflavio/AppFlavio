/**
 * app.config.ts — Application Configuration
 * Provides HttpClient (with fetch), Router, and Chart.js registration
 */
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

import { routes } from './app.routes';

Chart.register(...registerables);

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withFetch()),
        provideAnimations(),
        importProvidersFrom(NgChartsModule),
    ],
};

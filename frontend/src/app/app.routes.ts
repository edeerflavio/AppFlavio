import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ConsultationDetailComponent } from './pages/consultation-detail/consultation-detail.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'consultation/:id', component: ConsultationDetailComponent },
    { path: '**', redirectTo: '' }
];

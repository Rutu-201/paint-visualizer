import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards';
import { AuthPageComponent } from './pages/auth-page.component';
import { DashboardComponent } from './pages/dashboard.component';
import { EditorComponent } from './pages/editor.component';
import { AdminComponent } from './pages/admin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: AuthPageComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthPageComponent, data: { mode: 'register' } },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'editor', component: EditorComponent, canActivate: [authGuard] },
  { path: 'editor/:id', component: EditorComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: 'dashboard' }
];

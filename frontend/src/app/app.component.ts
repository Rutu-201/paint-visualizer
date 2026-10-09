import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, RouterModule],
  template: `
  <nav>
    <a routerLink="/dashboard" class="brand">🎨 Paint Visualizer</a>
    <span class="grow"></span>
    <ng-container *ngIf="auth.user$ | async as u; else guest">
      <a routerLink="/dashboard" routerLinkActive="act">My Projects</a>
      <a routerLink="/editor" routerLinkActive="act">New Design</a>
      <a *ngIf="u.role==='admin'" routerLink="/admin" routerLinkActive="act">Admin</a>
      <span class="muted">{{u.name}}</span>
      <button class="ghost" (click)="auth.logout()">Logout</button>
    </ng-container>
    <ng-template #guest><a routerLink="/login">Login</a><a routerLink="/register">Register</a></ng-template>
  </nav>
  <router-outlet></router-outlet>`,
  styles: [`nav{display:flex;gap:1rem;align-items:center;padding:.6rem 1.2rem;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5;flex-wrap:wrap}
  nav a{color:var(--ink);text-decoration:none}.brand{font-weight:700;font-size:1.1rem}.act{color:var(--brand);font-weight:600}.grow{flex:1}`]
})
export class AppComponent { constructor(public auth: AuthService) {} }

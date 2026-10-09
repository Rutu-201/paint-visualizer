import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-auth-page', standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="page wrap"><div class="card">
    <h2>{{register ? 'Create account' : 'Welcome back'}}</h2>
    <p class="muted">Preview paint colours on your own room photos.</p>
    <input *ngIf="register" [(ngModel)]="f.name" placeholder="Full name" (keyup.enter)="go()">
    <input [(ngModel)]="f.email" type="email" placeholder="Email" (keyup.enter)="go()">
    <input [(ngModel)]="f.password" type="password" placeholder="Password (min 6 characters)" (keyup.enter)="go()">
    <div class="err" *ngIf="err">{{err}}</div>
    <button (click)="go()" [disabled]="busy" style="width:100%;margin-top:.6rem">{{register ? 'Register' : 'Login'}}</button>
    <p class="muted" style="text-align:center">
      <ng-container *ngIf="register">Have an account? <a routerLink="/login">Login</a></ng-container>
      <ng-container *ngIf="!register">New here? <a routerLink="/register">Register</a></ng-container>
    </p>
  </div></div>`,
  styles: [`.wrap{max-width:420px;padding-top:4rem}`]
})
export class AuthPageComponent {
  f = { name: '', email: '', password: '' }; err = ''; busy = false; register: boolean;
  constructor(route: ActivatedRoute, private auth: AuthService, private router: Router) { this.register = route.snapshot.data['mode'] === 'register'; }
  go() {
    this.err = '';
    if (!this.f.email || !this.f.password || (this.register && !this.f.name)) { this.err = 'Please fill in all fields'; return; }
    this.busy = true;
    (this.register ? this.auth.register(this.f) : this.auth.login(this.f)).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: e => { this.err = e.error?.message || 'Could not reach the server'; this.busy = false; }
    });
  }
}

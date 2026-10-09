import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl + '/auth';
  user$ = new BehaviorSubject<User | null>(JSON.parse(localStorage.getItem('pv_user') || 'null'));
  constructor(private http: HttpClient, private router: Router) {}
  get user() { return this.user$.value; }
  get token() { return localStorage.getItem('pv_token'); }
  get isAdmin() { return this.user?.role === 'admin'; }
  private set(r: { token: string; user: User }) { localStorage.setItem('pv_token', r.token); this.setUser(r.user); }
  private setUser(u: User) { localStorage.setItem('pv_user', JSON.stringify(u)); this.user$.next(u); }
  login(b: any) { return this.http.post<any>(this.base + '/login', b).pipe(tap(r => this.set(r))); }
  register(b: any) { return this.http.post<any>(this.base + '/register', b).pipe(tap(r => this.set(r))); }
  logout() {
    const done = () => { localStorage.removeItem('pv_token'); localStorage.removeItem('pv_user'); this.user$.next(null); this.router.navigate(['/login']); };
    this.token ? this.http.post(this.base + '/logout', {}).subscribe({ next: done, error: done }) : done();
  }
  toggleFav(type: 'color' | 'pattern', id: string) { return this.http.post<User>(this.base + '/favourites', { type, id }).pipe(tap(u => this.setUser(u))); }
  feedback(rating: number, comment: string) { return this.http.post(this.base + '/feedback', { rating, comment }); }
}

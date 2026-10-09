import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = () => { const a = inject(AuthService); return a.token ? true : inject(Router).parseUrl('/login'); };
export const adminGuard: CanActivateFn = () => { const a = inject(AuthService); return a.isAdmin ? true : inject(Router).parseUrl('/dashboard'); };

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Project } from '../models';

@Component({
  selector: 'app-dashboard', standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="page">
    <div class="row"><h2 class="grow">My Projects</h2><a class="btn" routerLink="/editor">+ New design</a></div>
    <p class="muted" *ngIf="loaded && !projects.length">No saved designs yet. Upload a room photo and start painting!</p>
    <div class="grid">
      <div class="card" *ngFor="let p of projects">
        <img class="thumb" [src]="api.url(p.preview || p.original)" alt="">
        <h3 style="margin-bottom:0">{{p.name}}</h3>
        <div class="muted" style="font-size:.8rem">Updated {{p.updatedAt | date:'medium'}}</div>
        <div class="row" style="margin-top:.6rem">
          <a class="btn" [routerLink]="['/editor', p._id]">Open</a>
          <button class="ghost" (click)="remove(p)">Delete</button>
        </div>
      </div>
    </div>
    <div class="card fb">
      <h3 style="margin-top:0">Rate your experience</h3>
      <div class="row"><select [(ngModel)]="rating" style="width:auto"><option *ngFor="let n of [5,4,3,2,1]" [value]="n">{{n}} ★</option></select>
        <input class="grow" [(ngModel)]="comment" placeholder="Tell us what to improve (optional)">
        <button (click)="sendFb()">Send</button></div>
      <div class="ok" *ngIf="fbMsg">{{fbMsg}}</div>
    </div>
  </div>`,
  styles: [`.thumb{width:100%;height:150px;object-fit:cover;border-radius:8px;background:#eee}.fb{margin-top:1.5rem}`]
})
export class DashboardComponent implements OnInit {
  projects: Project[] = []; loaded = false; rating = 5; comment = ''; fbMsg = '';
  constructor(public api: ApiService, private auth: AuthService) {}
  ngOnInit() { this.api.projects().subscribe(p => { this.projects = p; this.loaded = true; }); }
  remove(p: Project) { if (confirm(`Delete "${p.name}"?`)) this.api.deleteProject(p._id!).subscribe(() => this.projects = this.projects.filter(x => x._id !== p._id)); }
  sendFb() { this.auth.feedback(+this.rating, this.comment).subscribe(() => { this.fbMsg = 'Thanks for your feedback!'; this.comment = ''; }); }
}

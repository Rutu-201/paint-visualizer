import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-admin', standalone: true, imports: [CommonModule, FormsModule],
  template: `
  <div class="page">
    <h2>Admin Panel</h2>
    <div class="seg"><button *ngFor="let t of tabs" [class.on]="tab===t" (click)="tab=t">{{t}}</button></div>
    <div class="ok" *ngIf="msg">{{msg}}</div><div class="err" *ngIf="err">{{err}}</div>

    <div *ngIf="tab==='Dashboard'" class="grid">
      <div class="card"><h3>Users</h3><h1>{{stats.users}}</h1></div>
      <div class="card"><h3>Room images uploaded</h3><h1>{{stats.imagesUploaded}}</h1></div>
      <div class="card"><h3>Designs saved</h3><h1>{{stats.designsSaved}}</h1></div>
      <div class="card"><h3>Avg session (min)</h3><h1>{{stats.avgSessionMinutes}}</h1></div>
      <div class="card"><h3>Avg satisfaction</h3><h1>{{stats.avgRating}} ★</h1></div>
      <div class="card" style="grid-column:1/-1"><h3 style="margin-top:0">Recent feedback</h3>
        <div *ngFor="let f of stats.feedback">{{f.rating}}★ — {{f.comment || '(no comment)'}} <span class="muted">· {{f.user?.name}}</span></div>
        <div class="muted" *ngIf="!stats.feedback?.length">No feedback yet.</div></div>
    </div>

    <div *ngIf="tab==='Colours'" class="card">
      <div class="row">
        <input style="width:170px" [(ngModel)]="cf.name" placeholder="Name"><input type="color" style="width:60px" [(ngModel)]="cf.hex">
        <input style="width:140px" [(ngModel)]="cf.brand" placeholder="Brand"><input style="width:200px" [(ngModel)]="cf.finishes" placeholder="Finishes: matte, glossy">
        <input style="width:200px" [(ngModel)]="cf.tags" placeholder="Tags: Living Room, Accent">
        <button (click)="saveColor()">{{cf._id?'Update':'Add'}}</button><button class="ghost" *ngIf="cf._id" (click)="resetColor()">Cancel</button>
      </div>
      <table><tr><th></th><th>Name</th><th>HEX</th><th>Brand</th><th>Finishes</th><th>Tags</th><th></th></tr>
        <tr *ngFor="let c of colors"><td><span class="sw" [style.background]="c.hex"></span></td><td>{{c.name}}</td><td>{{c.hex}}</td><td>{{c.brand}}</td><td>{{c.finishes?.join(', ')}}</td><td>{{c.tags?.join(', ')}}</td>
          <td><button class="ghost" (click)="editColor(c)">Edit</button> <button class="danger" (click)="del('colors',c._id)">Delete</button></td></tr></table>
    </div>

    <div *ngIf="tab==='Designs'" class="card">
      <div class="row">
        <input style="width:160px" [(ngModel)]="pf.name" placeholder="Name"><input style="width:130px" [(ngModel)]="pf.category" placeholder="Category (Floral)">
        <input style="width:200px" [(ngModel)]="pf.description" placeholder="Description"><input style="width:90px" type="number" step="0.1" [(ngModel)]="pf.scale" title="Scale">
        <input style="width:220px" type="file" accept="image/png,image/jpeg" (change)="pfile=$any($event.target).files[0]">
        <button (click)="savePattern()">{{pf._id?'Update':'Add'}}</button><button class="ghost" *ngIf="pf._id" (click)="resetPattern()">Cancel</button>
      </div>
      <table><tr><th></th><th>Name</th><th>Category</th><th>Scale</th><th></th></tr>
        <tr *ngFor="let p of patterns"><td><img [src]="api.url(p.image)" width="40" height="40" style="object-fit:cover;border-radius:6px" alt=""></td><td>{{p.name}}</td><td>{{p.category}}</td><td>{{p.scale}}</td>
          <td><button class="ghost" (click)="editPattern(p)">Edit</button> <button class="danger" (click)="del('patterns',p._id)">Delete</button></td></tr></table>
    </div>

    <div *ngIf="tab==='Activity'" class="card">
      <h3 style="margin-top:0">Users</h3>
      <table><tr><th>Name</th><th>Email</th><th>Role</th><th>Sessions</th><th>Joined</th></tr>
        <tr *ngFor="let u of users"><td>{{u.name}}</td><td>{{u.email}}</td><td>{{u.role}}</td><td>{{u.sessions}}</td><td>{{u.createdAt | date:'mediumDate'}}</td></tr></table>
      <h3>Saved designs</h3>
      <table><tr><th></th><th>Project</th><th>Owner</th><th>Updated</th></tr>
        <tr *ngFor="let p of projects"><td><img [src]="api.url(p.preview||p.original)" width="64" height="44" style="object-fit:cover;border-radius:6px" alt=""></td><td>{{p.name}}</td><td>{{p.owner?.name}} <span class="muted">{{p.owner?.email}}</span></td><td>{{p.updatedAt | date:'short'}}</td></tr></table>
    </div>

    <div *ngIf="tab==='Settings'" class="card" style="max-width:480px">
      <label>Site name<input [(ngModel)]="settings.siteName"></label>
      <label>Max upload size (MB, 1-10)<input type="number" min="1" max="10" [(ngModel)]="settings.maxUploadMB"></label>
      <label class="row"><input type="checkbox" [(ngModel)]="settings.allowRegistration"> Allow new user registration</label>
      <button (click)="saveSettings()">Save settings</button>
    </div>
  </div>`
})
export class AdminComponent implements OnInit {
  tabs = ['Dashboard', 'Colours', 'Designs', 'Activity', 'Settings']; tab = 'Dashboard'; msg = ''; err = '';
  stats: any = {}; colors: any[] = []; patterns: any[] = []; users: any[] = []; projects: any[] = []; settings: any = {};
  cf: any = this.blankColor(); pf: any = this.blankPattern(); pfile: File | null = null;
  constructor(public api: ApiService) {}
  ngOnInit() { this.load(); }
  load() {
    this.api.adminGet('stats').subscribe(s => this.stats = s);
    this.api.adminGet('settings').subscribe(s => this.settings = s);
    this.api.colors().subscribe(c => this.colors = c);
    this.api.patterns().subscribe(p => this.patterns = p);
    this.api.adminGet('users').subscribe(u => this.users = u);
    this.api.adminGet('projects').subscribe(p => this.projects = p);
  }
  private done(m: string) { this.msg = m; this.err = ''; this.load(); setTimeout(() => this.msg = '', 3000); }
  private fail(e: any) { this.err = e.error?.message || 'Request failed'; }
  blankColor() { return { name: '', hex: '#cccccc', brand: '', finishes: 'matte, satin, glossy', tags: '' }; }
  blankPattern() { return { name: '', category: '', description: '', scale: 1 }; }
  editColor(c: any) { this.cf = { ...c, finishes: (c.finishes || []).join(', '), tags: (c.tags || []).join(', ') }; }
  resetColor() { this.cf = this.blankColor(); }
  saveColor() {
    if (!this.cf.name) return this.fail({ error: { message: 'Colour name required' } });
    this.api.adminSave('colors', this.cf._id, this.cf).subscribe({ next: () => { this.resetColor(); this.done('Colour saved'); }, error: e => this.fail(e) });
  }
  editPattern(p: any) { this.pf = { ...p }; this.pfile = null; }
  resetPattern() { this.pf = this.blankPattern(); this.pfile = null; }
  savePattern() {
    if (!this.pf.name || (!this.pf._id && !this.pfile)) return this.fail({ error: { message: 'Name and image required' } });
    const fd = new FormData(); ['name', 'category', 'description', 'scale'].forEach(k => fd.append(k, this.pf[k] ?? ''));
    if (this.pfile) fd.append('image', this.pfile);
    this.api.adminSave('patterns', this.pf._id, fd).subscribe({ next: () => { this.resetPattern(); this.done('Design saved'); }, error: e => this.fail(e) });
  }
  del(path: string, id: string) { if (confirm('Delete this item?')) this.api.adminDelete(path, id).subscribe({ next: () => this.done('Deleted'), error: e => this.fail(e) }); }
  saveSettings() { this.api.saveSettings(this.settings).subscribe({ next: s => { this.settings = s; this.done('Settings saved'); }, error: e => this.fail(e) }); }
}

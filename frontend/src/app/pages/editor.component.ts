import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Color, Pattern, Pt, Trial, Wall } from '../models';

@Component({
  selector: 'app-editor', standalone: true, imports: [CommonModule, FormsModule],
  template: `
  <div class="editor">
    <aside>
      <input [(ngModel)]="name" placeholder="Project name">
      <label class="btn" style="display:block">📷 Upload room photo (JPG/PNG)<input type="file" accept="image/png,image/jpeg" hidden (change)="onFile($event)"></label>

      <h3>1 · Select wall</h3>
      <div class="seg">
        <button [class.on]="tool==='polygon'" (click)="tool='polygon'">Polygon</button>
        <button [class.on]="tool==='brush'" (click)="tool='brush'">Brush</button>
        <button [class.on]="tool==='edit'" (click)="tool='edit'">Edit</button>
      </div>
      <div class="muted hint" *ngIf="tool==='polygon'">Click wall corners. Click the first point (or press Apply) to close the shape.</div>
      <div class="muted hint" *ngIf="tool==='brush'">Drag over the wall; each stroke is painted with the current colour.</div>
      <div class="muted hint" *ngIf="tool==='edit'">Click a painted wall to select it, drag polygon corners to adjust.</div>
      <label *ngIf="tool==='brush'">Brush size: {{brushSize}}px<input type="range" min="5" max="150" [(ngModel)]="brushSize"></label>
      <div class="row" *ngIf="draft.length">
        <button (click)="finishPolygon()" [disabled]="draft.length<3">Apply paint</button>
        <button class="ghost" (click)="draft=[];render()">Cancel</button>
      </div>

      <h3>2 · Paint</h3>
      <div class="seg">
        <button [class.on]="paint.mode==='color'" (click)="paint.mode='color';paintChanged()">Solid</button>
        <button [class.on]="paint.mode==='dual'" (click)="paint.mode='dual';paintChanged()">Dual-tone</button>
        <button [class.on]="paint.mode==='pattern'" (click)="paint.mode='pattern';paintChanged()">Design</button>
      </div>

      <ng-container *ngIf="paint.mode!=='pattern'">
        <div class="seg" *ngIf="paint.mode==='dual'">
          <button [class.on]="target==='hex'" (click)="target='hex'"><span class="sw" [style.background]="paint.hex"></span> Top</button>
          <button [class.on]="target==='hex2'" (click)="target='hex2'"><span class="sw" [style.background]="paint.hex2"></span> Bottom</button>
        </div>
        <label *ngIf="paint.mode==='dual'">Split position: {{(paint.split*100)|number:'1.0-0'}}%<input type="range" min="0.1" max="0.9" step="0.05" [(ngModel)]="paint.split" (ngModelChange)="paintChanged()"></label>
        <div class="chips">
          <button [class.on]="tagFilter===''" (click)="tagFilter=''">All</button>
          <button [class.on]="tagFilter==='fav'" (click)="tagFilter='fav'">★ Favourites</button>
          <button *ngFor="let t of tags" [class.on]="tagFilter===t" (click)="tagFilter=t">{{t}}</button>
        </div>
        <div class="palette">
          <div class="color" *ngFor="let c of filtered()" [title]="c.name+' · '+(c.brand||'')" (click)="pick(c.hex)">
            <span class="sw big" [style.background]="c.hex" [class.sel]="paint[target]===c.hex"></span>
            <small>{{c.name}}</small>
            <i class="star" [class.on]="isFav(c._id)" (click)="fav($event,c._id)">★</i>
          </div>
        </div>
        <label>Custom colour<input type="color" [ngModel]="paint[target]" (ngModelChange)="pick($event)"></label>
      </ng-container>

      <ng-container *ngIf="paint.mode==='pattern'">
        <div class="palette">
          <div class="color" *ngFor="let p of patterns" (click)="paint.patternId=p._id!;paintChanged()">
            <img class="sw big" [src]="api.url(p.image)" [class.sel]="paint.patternId===p._id" alt="">
            <small>{{p.name}}</small>
          </div>
        </div>
        <div class="muted" *ngIf="!patterns.length">No designs available yet.</div>
      </ng-container>

      <label>Opacity: {{(paint.opacity*100)|number:'1.0-0'}}%<input type="range" min="0.1" max="1" step="0.05" [(ngModel)]="paint.opacity" (ngModelChange)="paintChanged()"></label>
      <label>Finish<select [(ngModel)]="paint.finish" (ngModelChange)="paintChanged()"><option>matte</option><option>satin</option><option>glossy</option></select></label>

      <h3>Walls in this trial</h3>
      <div class="muted" *ngIf="!walls.length">Nothing painted yet.</div>
      <div class="row wall" *ngFor="let w of walls; let i=index" [class.sel]="i===sel" (click)="selectWall(i)">
        <span class="sw" [style.background]="w.mode==='pattern'?'#ccc':w.hex"></span>
        <span class="grow">Wall {{i+1}} · {{w.kind}} · {{w.mode}}</span>
        <button class="ghost" (click)="removeWall(i);$event.stopPropagation()">✕</button>
      </div>
    </aside>

    <main>
      <div class="row bar">
        <div class="tabs grow">
          <button *ngFor="let t of trials; let i=index" [class.on]="i===active" (click)="setTrial(i)">{{t.name}}</button>
          <button class="ghost" (click)="addTrial(false)" title="Empty trial">＋</button>
          <button class="ghost" (click)="addTrial(true)" title="Duplicate current trial">⧉</button>
          <button class="ghost" *ngIf="trials.length>1" (click)="removeTrial()" title="Delete trial">🗑</button>
        </div>
        <button class="ghost" (click)="undo()">↶ Undo</button>
        <button [class.ghost]="!compare" (click)="compare=!compare;render()">Before / After</button>
        <button (click)="save()">💾 Save</button>
        <button class="ghost" (click)="download()">⬇ Download</button>
      </div>
      <div class="row" *ngIf="compare"><span class="muted">Before</span><input class="grow" type="range" min="0" max="1" step="0.01" [(ngModel)]="cmpPos" (ngModelChange)="render()"><span class="muted">After</span></div>
      <div class="msg" *ngIf="msg">{{msg}}</div>
      <div class="stage">
        <div class="empty" *ngIf="!img">Upload a room photo to begin.<br><small class="muted">Tip: use a bright, clear photo with the wall fully visible.</small></div>
        <canvas #cv [hidden]="!img"
          (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointerleave)="up()"></canvas>
      </div>
    </main>
  </div>`,
  styles: [`
  .editor{display:grid;grid-template-columns:320px 1fr;height:calc(100vh - 56px)}
  aside{background:#fff;border-right:1px solid var(--line);padding:1rem;overflow:auto}
  main{padding:1rem;overflow:auto}
  .hint{font-size:.8rem;margin:.2rem 0}
  .bar{margin-bottom:.6rem}.tabs{display:flex;gap:4px;flex-wrap:wrap}
  .tabs button.on,.chips button.on{background:var(--brand);color:#fff}
  .tabs button:not(.on):not(.ghost),.chips button:not(.on){background:#fff;color:var(--ink);border:1px solid var(--line)}
  .chips{display:flex;gap:4px;flex-wrap:wrap;margin:.4rem 0}.chips button{padding:.2rem .55rem;font-size:.75rem;border-radius:99px}
  .palette{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:210px;overflow:auto;margin:.3rem 0}
  .color{text-align:center;cursor:pointer;position:relative}.color small{display:block;font-size:.62rem;line-height:1.1;margin-top:2px}
  .sw.big{width:100%;height:38px;border-radius:8px;object-fit:cover}.sw.sel{outline:3px solid var(--brand)}
  .star{position:absolute;top:0;right:3px;font-style:normal;color:#fff;text-shadow:0 0 3px #000;font-size:.9rem}.star.on{color:#ffc933}
  .wall{padding:.3rem;border:1px solid var(--line);border-radius:8px;margin:.25rem 0;cursor:pointer;font-size:.85rem}.wall.sel{border-color:var(--brand);background:#eef5ff}
  .wall button{padding:.1rem .45rem}
  .stage{background:#e9e6df;border-radius:12px;min-height:300px;display:flex;justify-content:center;align-items:flex-start;padding:.5rem}
  canvas{max-width:100%;max-height:calc(100vh - 190px);touch-action:none;cursor:crosshair;border-radius:6px;background:#fff}
  .empty{padding:4rem 1rem;text-align:center}.msg{padding:.3rem .6rem;margin-bottom:.5rem;background:#fff;border-radius:8px;border:1px solid var(--line)}
  @media(max-width:900px){.editor{grid-template-columns:1fr;height:auto}aside{border-right:0;border-bottom:1px solid var(--line)}}
  `]
})
export class EditorComponent implements OnInit {
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;
  img: HTMLImageElement | null = null; file: File | null = null; projectId: string | null = null; name = 'My room';
  colors: Color[] = []; patterns: Pattern[] = []; patImgs: { [id: string]: HTMLImageElement } = {};
  trials: Trial[] = [{ name: 'Trial 1', walls: [] }]; active = 0; sel = -1;
  tool: 'polygon' | 'brush' | 'edit' = 'polygon'; brushSize = 40; draft: Pt[] = []; stroke: Pt[] = []; brushing = false; dragIdx = -1;
  paint = { mode: 'color' as Wall['mode'], hex: '#6FA8DC', hex2: '#F5EBD7', split: 0.5, patternId: null as string | null, opacity: 0.85, finish: 'matte' };
  target: 'hex' | 'hex2' = 'hex'; tagFilter = ''; compare = false; cmpPos = 0.5; msg = '';
  private tmp = document.createElement('canvas');

  constructor(public api: ApiService, private auth: AuthService, private route: ActivatedRoute, private loc: Location) {}
  get walls() { return this.trials[this.active].walls; }
  get tags() { return [...new Set(this.colors.flatMap(c => c.tags || []))].sort(); }

  ngOnInit() {
    this.api.colors().subscribe(c => this.colors = c);
    this.api.patterns().subscribe(ps => {
      this.patterns = ps;
      ps.forEach(p => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => this.render(); i.src = this.api.url(p.image); this.patImgs[p._id!] = i; });
      if (ps.length && !this.paint.patternId) this.paint.patternId = ps[0]._id!;
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.api.project(id).subscribe({
      next: p => {
        this.projectId = p._id!; this.name = p.name; this.trials = p.trials?.length ? p.trials : this.trials;
        this.loadImage(this.api.url(p.original));
      }, error: () => this.flash('Project not found')
    });
  }

  // ---------- image & state ----------
  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) return this.flash('Only JPG or PNG images are allowed');
    if (f.size > 10 * 1024 * 1024) return this.flash('Image must be under 10 MB');
    if (this.projectId) { this.projectId = null; this.loc.replaceState('/editor'); }  // new photo = new project
    this.file = f; this.trials = [{ name: 'Trial 1', walls: [] }]; this.active = 0; this.sel = -1; this.draft = [];
    this.loadImage(URL.createObjectURL(f));
  }
  loadImage(src: string) {
    const i = new Image(); i.crossOrigin = 'anonymous';
    i.onload = () => {
      const sc = Math.min(1, 1280 / i.naturalWidth), c = this.cv.nativeElement;
      c.width = Math.round(i.naturalWidth * sc); c.height = Math.round(i.naturalHeight * sc);
      this.img = i; this.render();
    };
    i.onerror = () => this.flash('Could not load image');
    i.src = src;
  }
  flash(m: string) { this.msg = m; setTimeout(() => this.msg = '', 3500); }
  k() { return this.cv.nativeElement.width / this.cv.nativeElement.getBoundingClientRect().width; }
  pt(e: PointerEvent): Pt { const c = this.cv.nativeElement, r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; }
  dist(a: Pt, b: Pt) { return Math.hypot(a.x - b.x, a.y - b.y); }

  // ---------- pointer tools ----------
  down(e: PointerEvent) {
    if (!this.img) return; const p = this.pt(e), k = this.k();
    if (this.tool === 'polygon') {
      if (this.draft.length >= 3 && this.dist(p, this.draft[0]) < 14 * k) { this.finishPolygon(); return; }
      this.draft.push(p);
    } else if (this.tool === 'brush') {
      this.stroke = [p]; this.brushing = true; (e.target as Element).setPointerCapture?.(e.pointerId);
    } else {
      const w = this.walls[this.sel];
      if (w?.kind === 'polygon') { const i = w.points.findIndex(q => this.dist(p, q) < 12 * k); if (i >= 0) { this.dragIdx = i; return; } }
      const hit = this.hit(p); if (hit >= 0) this.selectWall(hit); else { this.sel = -1; }
    }
    this.render();
  }
  move(e: PointerEvent) {
    if (this.brushing) { this.stroke.push(this.pt(e)); this.render(); }
    else if (this.dragIdx >= 0) { this.walls[this.sel].points[this.dragIdx] = this.pt(e); this.render(); }
  }
  up() {
    if (this.brushing) { this.brushing = false; if (this.stroke.length) this.addWall('brush', this.stroke, this.brushSize); this.stroke = []; }
    this.dragIdx = -1;
  }
  finishPolygon() { if (this.draft.length < 3) return; this.addWall('polygon', [...this.draft], 0); this.draft = []; this.render(); }
  addWall(kind: Wall['kind'], points: Pt[], size: number) { this.walls.push({ kind, points, size, ...this.paint }); this.sel = this.walls.length - 1; this.render(); }
  hit(p: Pt) {
    const q = this.tmp.getContext('2d')!;
    for (let i = this.walls.length - 1; i >= 0; i--) {
      this.tmp.width = this.cv.nativeElement.width; this.tmp.height = this.cv.nativeElement.height;
      this.mask(q, this.walls[i]); if (q.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data[3] > 0) return i;
    }
    return -1;
  }

  // ---------- wall / paint management ----------
  selectWall(i: number) {
    this.sel = i; const w = this.walls[i];
    Object.assign(this.paint, { mode: w.mode, hex: w.hex, hex2: w.hex2, split: w.split, patternId: w.patternId ?? this.paint.patternId, opacity: w.opacity, finish: w.finish });
    this.render();
  }
  removeWall(i: number) { this.walls.splice(i, 1); this.sel = -1; this.render(); }
  paintChanged() { if (this.sel >= 0 && this.walls[this.sel]) Object.assign(this.walls[this.sel], this.paint); this.render(); }
  pick(hex: string) { this.paint[this.target] = hex; this.paintChanged(); }
  filtered() { const f = this.auth.user?.favColors || []; return this.colors.filter(c => !this.tagFilter || (this.tagFilter === 'fav' ? f.includes(c._id!) : c.tags?.includes(this.tagFilter))); }
  isFav(id?: string) { return !!id && !!this.auth.user?.favColors.includes(id); }
  fav(e: Event, id?: string) { e.stopPropagation(); if (id) this.auth.toggleFav('color', id).subscribe(); }
  undo() { if (this.draft.length) this.draft.pop(); else if (this.walls.length) { this.walls.pop(); this.sel = -1; } this.render(); }
  setTrial(i: number) { this.active = i; this.sel = -1; this.draft = []; this.render(); }
  addTrial(copy: boolean) {
    const walls: Wall[] = copy ? JSON.parse(JSON.stringify(this.walls)) : [];
    this.trials.push({ name: 'Trial ' + (this.trials.length + 1), walls }); this.setTrial(this.trials.length - 1);
  }
  removeTrial() { this.trials.splice(this.active, 1); this.setTrial(Math.max(0, this.active - 1)); }

  // ---------- rendering ----------
  mask(q: CanvasRenderingContext2D, w: Wall) {
    q.fillStyle = q.strokeStyle = '#000'; q.beginPath();
    w.points.forEach((p, i) => i ? q.lineTo(p.x, p.y) : q.moveTo(p.x, p.y));
    if (w.kind === 'polygon') { q.closePath(); q.fill(); }
    else { q.lineWidth = w.size; q.lineCap = q.lineJoin = 'round'; if (w.points.length === 1) q.lineTo(w.points[0].x + .01, w.points[0].y); q.stroke(); }
  }
  fillFor(q: CanvasRenderingContext2D, w: Wall): string | CanvasGradient | CanvasPattern {
    if (w.mode === 'color') return w.hex;
    if (w.mode === 'dual') {
      const ys = w.points.map(p => p.y), pad = w.kind === 'brush' ? w.size / 2 : 0, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad, g = q.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, w.hex); g.addColorStop(w.split, w.hex); g.addColorStop(w.split, w.hex2); g.addColorStop(1, w.hex2); return g;
    }
    const im = w.patternId ? this.patImgs[w.patternId] : null; if (!im || !im.complete || !im.naturalWidth) return 'rgba(0,0,0,0)';
    const pat = q.createPattern(im, 'repeat')!, s = this.patterns.find(p => p._id === w.patternId)?.scale || 1;
    pat.setTransform?.(new DOMMatrix().scale(s)); return pat;
  }
  paintWall(x: CanvasRenderingContext2D, w: Wall) {
    const c = this.cv.nativeElement, t = this.tmp, q = t.getContext('2d')!; t.width = c.width; t.height = c.height;
    this.mask(q, w); q.globalCompositeOperation = 'source-in'; q.fillStyle = this.fillFor(q, w); q.fillRect(0, 0, t.width, t.height);
    x.save(); x.globalAlpha = w.opacity; x.globalCompositeOperation = w.mode === 'pattern' ? 'source-over' : 'multiply'; x.drawImage(t, 0, 0); x.restore();
    const gloss = w.finish === 'glossy' ? .16 : w.finish === 'satin' ? .07 : 0;
    if (gloss) { q.fillStyle = '#fff'; q.fillRect(0, 0, t.width, t.height); x.save(); x.globalAlpha = gloss * w.opacity; x.drawImage(t, 0, 0); x.restore(); }
  }
  render(ui = true) {
    if (!this.img) return; const c = this.cv.nativeElement, x = c.getContext('2d')!;
    x.clearRect(0, 0, c.width, c.height); x.drawImage(this.img, 0, 0, c.width, c.height);
    this.walls.forEach(w => this.paintWall(x, w));
    if (!ui) return;
    if (this.compare) {
      x.save(); x.beginPath(); x.rect(0, 0, c.width * this.cmpPos, c.height); x.clip(); x.drawImage(this.img, 0, 0, c.width, c.height); x.restore();
      x.fillStyle = '#fff'; x.fillRect(c.width * this.cmpPos - 2, 0, 4, c.height);
    }
    const k = this.k(); x.lineWidth = 2 * k; x.strokeStyle = '#ff2d75'; x.fillStyle = '#fff'; x.setLineDash([8 * k, 5 * k]);
    const line = (pts: Pt[], close: boolean) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)); if (close) x.closePath(); x.stroke(); };
    if (this.draft.length) { line(this.draft, false); this.draft.forEach((p, i) => { x.beginPath(); x.arc(p.x, p.y, (i ? 4 : 7) * k, 0, 7); x.fill(); x.stroke(); }); }
    const s = this.walls[this.sel];
    if (s?.kind === 'polygon') { line(s.points, true); x.setLineDash([]); s.points.forEach(p => { x.fillRect(p.x - 5 * k, p.y - 5 * k, 10 * k, 10 * k); x.strokeRect(p.x - 5 * k, p.y - 5 * k, 10 * k, 10 * k); }); }
    if (this.brushing && this.stroke.length) { x.setLineDash([]); x.globalAlpha = .45; x.strokeStyle = this.paint.hex; x.lineWidth = this.brushSize; x.lineCap = x.lineJoin = 'round'; line(this.stroke.length === 1 ? [this.stroke[0], { x: this.stroke[0].x + .01, y: this.stroke[0].y }] : this.stroke, false); x.globalAlpha = 1; }
    x.setLineDash([]);
  }

  // ---------- persistence ----------
  save() {
    if (!this.img) return this.flash('Upload a room photo first');
    if (!this.projectId && !this.file) return this.flash('Upload a room photo first');
    this.render(false);
    this.cv.nativeElement.toBlob(b => {
      const c = this.cv.nativeElement, fd = new FormData();
      fd.append('name', this.name || 'Untitled room'); fd.append('trials', JSON.stringify(this.trials)); fd.append('width', '' + c.width); fd.append('height', '' + c.height);
      if (b) fd.append('preview', b, 'preview.png');
      if (!this.projectId) fd.append('original', this.file!);
      (this.projectId ? this.api.updateProject(this.projectId, fd) : this.api.createProject(fd)).subscribe({
        next: p => { if (!this.projectId) this.loc.replaceState('/editor/' + p._id); this.projectId = p._id!; this.flash('Saved ✓'); },
        error: e => this.flash(e.error?.message || 'Save failed')
      });
      this.render();
    }, 'image/png');
  }
  download() {
    if (!this.img) return this.flash('Upload a room photo first');
    this.render(false);
    this.cv.nativeElement.toBlob(b => {
      if (b) { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (this.name || 'painted-room') + '.png'; a.click(); URL.revokeObjectURL(a.href); }
      this.render();
    }, 'image/png');
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Color, Pattern, Project } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private a = environment.apiUrl;
  constructor(private http: HttpClient) {}
  url(p?: string) { return !p ? '' : p.startsWith('http') ? p : environment.serverUrl + p; }
  colors() { return this.http.get<Color[]>(this.a + '/catalog/colors'); }
  patterns() { return this.http.get<Pattern[]>(this.a + '/catalog/patterns'); }
  projects() { return this.http.get<Project[]>(this.a + '/projects'); }
  project(id: string) { return this.http.get<Project>(`${this.a}/projects/${id}`); }
  createProject(fd: FormData) { return this.http.post<Project>(this.a + '/projects', fd); }
  updateProject(id: string, fd: FormData) { return this.http.put<Project>(`${this.a}/projects/${id}`, fd); }
  deleteProject(id: string) { return this.http.delete(`${this.a}/projects/${id}`); }
  // admin
  adminGet<T = any>(path: string) { return this.http.get<T>(`${this.a}/admin/${path}`); }
  adminSave(path: string, id: string | undefined, body: any) { return id ? this.http.put<any>(`${this.a}/admin/${path}/${id}`, body) : this.http.post<any>(`${this.a}/admin/${path}`, body); }
  adminDelete(path: string, id: string) { return this.http.delete(`${this.a}/admin/${path}/${id}`); }
  saveSettings(b: any) { return this.http.put<any>(this.a + '/admin/settings', b); }
}

export interface User { id: string; name: string; email: string; role: 'user' | 'admin'; favColors: string[]; favPatterns: string[]; }
export interface Color { _id?: string; name: string; hex: string; brand?: string; finishes: string[]; tags: string[]; }
export interface Pattern { _id?: string; name: string; description?: string; category?: string; image: string; scale: number; }
export interface Pt { x: number; y: number; }
export interface Wall { kind: 'polygon' | 'brush'; points: Pt[]; size: number; mode: 'color' | 'dual' | 'pattern'; hex: string; hex2: string; split: number; patternId: string | null; opacity: number; finish: string; }
export interface Trial { name: string; walls: Wall[]; }
export interface Project { _id?: string; name: string; original: string; preview?: string; width: number; height: number; trials: Trial[]; updatedAt?: string; owner?: any; }

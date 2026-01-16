 import { Injectable } from '@angular/core';
 import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

 @Injectable({ providedIn: 'root' })
 export class HoverLocandinaService {
  hoverSlug$ = new BehaviorSubject<string | null>(null);

  osserva(): Observable<string | null> {
    return this.hoverSlug$.asObservable().pipe(distinctUntilChanged());
   }

  emettiEntrata(slug: string): void {
    this.hoverSlug$.next(slug || null);
   }

   emettiUscita(): void {
    this.hoverSlug$.next(null);
   }
 }

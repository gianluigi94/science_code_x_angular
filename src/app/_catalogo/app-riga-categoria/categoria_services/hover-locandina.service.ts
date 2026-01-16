 import { Injectable } from '@angular/core';
 import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

 @Injectable({ providedIn: 'root' })
 export class HoverLocandinaService {
  hoverSlug$ = new BehaviorSubject<string | null>(null);
  timerUscita: any = null;

  osserva(): Observable<string | null> {
    return this.hoverSlug$.asObservable().pipe(distinctUntilChanged());
   }

     annullaUscita(): void {
    if (this.timerUscita) {
      clearTimeout(this.timerUscita);
      this.timerUscita = null;
    }
  }

  pianificaUscita(ritardoMs: number): void {
    this.annullaUscita();
    this.timerUscita = setTimeout(() => {
      this.timerUscita = null;
      this.hoverSlug$.next(null);
    }, Math.max(0, ritardoMs || 0));
  }

  emettiEntrata(slug: string): void {
    this.annullaUscita();
    this.hoverSlug$.next(slug || null);
   }

   emettiUscita(): void {
          this.annullaUscita();
    this.hoverSlug$.next(null);
   }
 }

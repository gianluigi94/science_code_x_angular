 import { Injectable } from '@angular/core';
 import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

 @Injectable({ providedIn: 'root' })
 export class HoverLocandinaService {
  hoverLocandina$ = new BehaviorSubject<{ slug: string; sottotitolo: string } | null>(null);
  timerUscita: any = null;

  osserva(): Observable<{ slug: string; sottotitolo: string } | null> {
        return this.hoverLocandina$.asObservable().pipe(
      distinctUntilChanged((a, b) => (a?.slug || '') === (b?.slug || '') && (a?.sottotitolo || '') === (b?.sottotitolo || ''))
    );
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
      this.hoverLocandina$.next(null);
    }, Math.max(0, ritardoMs || 0));
  }

  emettiEntrata(slug: string, sottotitolo: string): void {
    this.annullaUscita();
    this.hoverLocandina$.next(slug ? { slug, sottotitolo: sottotitolo || '' } : null);
   }

   emettiUscita(): void {
          this.annullaUscita();
    this.hoverLocandina$.next(null);
   }
 }

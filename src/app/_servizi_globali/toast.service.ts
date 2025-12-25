// DOPO (toast.service.ts)
import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';

export type TipoToast = 'info' | 'success' | 'error' | 'allarm';

export interface ToastMessage {
  testo: string;
  tipo: TipoToast;
  persistente?: boolean;
  azione?: 'ripeti_accesso';
  chiave?: string;
  mostraSpinner?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new ReplaySubject<ToastMessage>(1);
  toast$ = this.toastSubject.asObservable();

  private chiudiSubject = new Subject<string>();
  chiudi$ = this.chiudiSubject.asObservable();
private chiudiTuttiSubject = new Subject<void>();
chiudiTutti$ = this.chiudiTuttiSubject.asObservable();
 mostra(
  testo: string,
  tipo: TipoToast = 'info',
  persistente: boolean = false,
  azione?: 'ripeti_accesso',
  chiave?: string,
  mostraSpinner: boolean = false
): void {
  this.toastSubject.next({ testo, tipo, persistente, azione, chiave, mostraSpinner });
}

  chiudi(chiave: string): void {
    this.chiudiSubject.next(chiave);
  }
  chiudiTutti(): void {
    this.chiudiTuttiSubject.next();
  }
  errore(testo: string): void {
    this.mostra(testo, 'error');
  }

// DOPO (toast.service.ts)
successo(testo: string, chiave?: string): void {
  this.mostra(testo, 'success', false, undefined, chiave);
}


successoConSpinner(testo: string, chiave: string): void {
  this.mostra(testo, 'success', false, undefined, chiave, true);
}

  allarm(testo: string): void {
    this.mostra(testo, 'allarm');
  }

  errorePersistente(testo: string): void {
    this.mostra(testo, 'error', true);
  }

  allarmPersistenteRipetiAccesso(testo: string): void {
    this.mostra(testo, 'allarm', true, 'ripeti_accesso');
  }
}

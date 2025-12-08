import { Injectable } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs'; // 👈 AGGIUNGI ReplaySubject

export type TipoToast = 'info' | 'success' | 'error' | 'allarm';

export interface ToastMessage {
  testo: string;
  tipo: TipoToast;
  persistente?: boolean;
  azione?: 'ripeti_accesso';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // ❌ PRIMA
  // private toastSubject = new Subject<ToastMessage>();

  // ✅ DOPO: tiene in memoria l'ultimo toast
  private toastSubject = new ReplaySubject<ToastMessage>(1);

  toast$ = this.toastSubject.asObservable();

  mostra(testo: string, tipo: TipoToast = 'info', persistente: boolean = false, azione?: 'ripeti_accesso'): void {
    this.toastSubject.next({ testo, tipo, persistente, azione });
  }

  errore(testo: string): void {
    this.mostra(testo, 'error');
  }

  successo(testo: string): void {
    this.mostra(testo, 'success');
  }

  allarm(testo: string): void {
    this.mostra(testo, 'allarm');
  }

  errorePersistente(testo: string): void {
    this.mostra(testo, 'error', true);
  }

  // 🔹 toast giallo, persistente, con link "Ripeti l'accesso"
  allarmPersistenteRipetiAccesso(testo: string): void {
    this.mostra(testo, 'allarm', true, 'ripeti_accesso');
  }
}

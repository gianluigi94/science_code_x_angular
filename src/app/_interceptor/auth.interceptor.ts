// src/app/_interceptor/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { Authservice } from '../_benvenuto/login/_login_service/auth.service';
import { Router } from '@angular/router';
import { ErroreGlobaleService } from '../_servizi_globali/errore-globale.service';
import { StatoSessioneClientService } from '../_servizi_globali/stato-sessione-client.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: Authservice,
    private router: Router,
    private erroreGlobale: ErroreGlobaleService,
    private statoSessione: StatoSessioneClientService
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    let reqDaUsare = req;

    // niente bearer sulle chiamate /accedi e /traduzioni-lingua
    if (!req.url.includes('/accedi') && !req.url.includes('/traduzioni-lingua')) {
      const auth = this.authService.leggiAuthDaLocalStorage();
      const tk = auth?.tk;

      if (tk) {
        reqDaUsare = req.clone({
          setHeaders: {
            Authorization: `Bearer ${tk}`,
          },
        });
      }
    }

    return next.handle(reqDaUsare).pipe(

      tap({
        next: (event) => {
          if (event instanceof HttpResponse && !req.url.includes('/accedi')) {

            const now = performance.now();
            console.log('RISPOSTA SERVER (status ' + event.status + ') alle ' + now + ' ms');

            const haTokenIniziale = this.statoSessione.haTokenIniziale;
            const richiestaConBearer = reqDaUsare.headers.has('Authorization');

            if (!haTokenIniziale) {
              // nessun token salvato all'avvio: prima risposta OK basta
              this.statoSessione.segnaSessioneVerificata();
            } else {
              // avevo un token: considero "confermata" solo una risposta OK con bearer
              if (richiestaConBearer) {
                this.statoSessione.sessioneGiaConfermata = true;
                this.statoSessione.segnaSessioneVerificata();
              }
            }
          }
        }
      }),

      catchError((err: HttpErrorResponse) => {
        const rawMsg =
          (err?.error as any)?.message ||
          (typeof err?.error === 'string' ? err.error : '') ||
          err.message ||
          '';

        // login: il componente se la gestisce da solo
        if (req.url.includes('/accedi')) {
          return throwError(() => err);
        }
const msgLower = (rawMsg || '').toLowerCase();
const eTokenScadutoMascheratoDa500 =
  err.status === 500 && (msgLower.includes('expired token') || msgLower.includes('token scaduto'));

        // 🔹 gestione sessione (unica fonte di verità)
        if (err.status === 401 || err.status === 403 || eTokenScadutoMascheratoDa500) {

          const haTokenIniziale = this.statoSessione.haTokenIniziale;
          const giaConfermata = this.statoSessione.sessioneGiaConfermata;

          // CASO A: token morto all'ingresso
          const deveEssereTrattatoComeIniziale = haTokenIniziale && !giaConfermata;

          if (deveEssereTrattatoComeIniziale) {
            // token salvato da subito, ma nessuna chiamata con bearer è mai andata bene
            this.authService.logout(false);

            // dopo il reload mostreremo il toast di bentornato
            localStorage.setItem('toast_benvenuto', 'true');

            if (!this.statoSessione.staRicaricando) {
              this.statoSessione.staRicaricando = true;
              this.erroreGlobale.resettaErroreFatale();
              window.location.reload();
            }

          } else {
            // CASO B: token scaduto mentre ero dentro → pagina bloccante + toast giallo
            this.authService.logout(true);

            let codiceSessione: string = 'GENERICA';

            if (rawMsg.includes('SESSIONE STANDARD SCADUTA')) {
              codiceSessione = 'STANDARD';
            } else if (rawMsg.includes('SCADUTA PER INATTIVIT')) {
              codiceSessione = 'INATTIVITA';
            } else if (rawMsg.includes('SESSIONE COLLEGATO SCADUTA')) {
              codiceSessione = 'COLLEGATO';
            } else if (rawMsg.includes('TOKEN SCADUTO')) {
              codiceSessione = 'COLLEGATO';
            }

            this.erroreGlobale.segnalaErroreSessione(codiceSessione);
          }
        }

        // gli errori server 500 / rete / ecc. li gestisce ErroreHttpInterceptor
        return throwError(() => err);
      })
    );
  }
}

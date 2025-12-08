// errore-http.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErroreGlobaleService } from 'src/app/_servizi_globali/errore-globale.service';

@Injectable()
export class ErroreHttpInterceptor implements HttpInterceptor {
  constructor(private erroreGlobaleService: ErroreGlobaleService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // 👇 la login si gestisce da sola
        if (req.url.includes('/accedi') || req.url.includes('/logout')) {
          return throwError(() => err);
        }

        // 👇 401/403 li gestisce SOLO l'AuthInterceptor
        if (err.status === 401 || err.status === 403) {
          return throwError(() => err);
        }

        // 👇 tutti gli altri errori (500, 0, 4xx vari) = errore server bloccante
        const msgBackend =
          (err?.error as any)?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err.message ||
          'Errore sconosciuto';

        this.erroreGlobaleService.segnalaErroreServer(msgBackend);

        return throwError(() => err);
      })
    );
  }
}

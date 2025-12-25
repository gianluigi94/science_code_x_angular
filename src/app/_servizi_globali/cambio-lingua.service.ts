import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Subject, forkJoin, of, take, switchMap, map, tap, catchError } from 'rxjs';
import { TraduzioniService } from './traduzioni.service';
import { CaroselloNovitaService, NovitaInfo } from 'src/app/_catalogo/carosello-novita/carosello_services/carosello-novita.service';
import { Authservice } from 'src/app/_benvenuto/login/_login_service/auth.service';
import { ToastService } from 'src/app/_servizi_globali/toast.service';
@Injectable({ providedIn: 'root' })
export class CambioLinguaService {
 linguaUtente = 'inglese';
iconaLingua = 'assets/en.svg';
iconaLingua$ = new BehaviorSubject<string>('');


  // ✅ eventi stile “progetto grande”
  cambioLinguaAvviato$ = new Subject<string>(); // codice 'it'/'en'
  cambioLinguaApplicata$ = new Subject<{ codice: string; mappaNovita: Record<string, NovitaInfo> }>();

constructor(
  private traduzioniService: TraduzioniService,
  private injector: Injector,
    private authService: Authservice,
  private toastService: ToastService
) {
  this.impostaLinguaIniziale();

  this.iconaLingua$.next(this.iconaLingua);

  const codiceLingua = this.leggiCodiceLingua();
  this.traduzioniService.assicuraTraduzioni$(codiceLingua).pipe(take(1)).subscribe(() => {
    this.traduzioniService.usaLingua(codiceLingua);
  });
}



  cambiaLingua(): void {
    if (this.linguaUtente === 'inglese') {
      this.linguaUtente = 'italiano';
      this.iconaLingua = 'assets/it.svg';
    } else {
      this.linguaUtente = 'inglese';
      this.iconaLingua = 'assets/en.svg';
    }

    localStorage.setItem('lingua_utente', this.linguaUtente);
    this.iconaLingua$.next(this.iconaLingua);

    const codice = this.leggiCodiceLingua();
    this.toastService.chiudiTutti();
    // 1) subito: “sto cambiando lingua”
    this.cambioLinguaAvviato$.next(codice);

   const srv = this.prendiCaroselloNovitaService();
const possoCaricareNovita = this.utenteAutenticato() && !!srv;

const novita$ = possoCaricareNovita
  ? srv!.getInfoNovitaMap(codice).pipe(
      take(1),
      catchError(() => of({} as Record<string, NovitaInfo>))
    )
  : of({} as Record<string, NovitaInfo>);

// 2) PREPARA TUTTO (traduzioni + mappa carosello + preload img titoli)
forkJoin({
  t: this.traduzioniService.assicuraTraduzioni$(codice).pipe(take(1)),
  m: novita$,
})
  .pipe(
    switchMap(({ m }) => this.precaricaImmaginiTitolo$(m).pipe(map(() => m))),
    tap((mappaNovita) => {
      // 3) ORA applico la lingua (tutto cambia insieme)
      this.traduzioniService.usaLingua(codice);

      // 4) e notifico il carosello con i dati già pronti
      this.cambioLinguaApplicata$.next({ codice, mappaNovita });
    })
  )
  .subscribe();

  }

  leggiCodiceLingua(): string {
    return this.linguaUtente === 'italiano' ? 'it' : 'en';
  }

  private precaricaImmaginiTitolo$(mappa: Record<string, NovitaInfo>) {
    const urls = Object.values(mappa).map(x => x.img_titolo).filter(Boolean);

    if (!urls.length) return of(void 0);

    return forkJoin(urls.map((u) => this.precaricaImmagine$(u))).pipe(map(() => void 0));
  }

  private precaricaImmagine$(url: string) {
    return new (class {
      asObservable() {
        return new Promise<void>((ok) => {
          const img = new Image();
          img.src = url;
          if ((img as any).decode) {
            (img as any).decode().then(() => ok()).catch(() => ok());
          } else if (img.complete) ok();
          else img.onload = img.onerror = () => ok();
        });
      }
    })().asObservable();
  }

  haInCacheProssimaLingua(): boolean {
  const prossimaLingua = this.linguaUtente === 'italiano' ? 'inglese' : 'italiano';
  const codiceProssima = prossimaLingua === 'italiano' ? 'it' : 'en';
  return this.traduzioniService.haTraduzioniInCache(codiceProssima);
}

private impostaLinguaIniziale(): void {
  const salvata = localStorage.getItem('lingua_utente');

  if (salvata === 'italiano' || salvata === 'inglese') {
    this.linguaUtente = salvata;
  } else {
    const primaria = (navigator.languages?.[0] || navigator.language || '').toLowerCase().trim();

    const eItaliano = primaria === 'it' || primaria.startsWith('it-');
    this.linguaUtente = eItaliano ? 'italiano' : 'inglese';
  }

  this.iconaLingua = this.linguaUtente === 'italiano' ? 'assets/it.svg' : 'assets/en.svg';
}


  private utenteAutenticato(): boolean {
    const auth = this.authService.leggiObsAuth().getValue();
    return !!auth?.tk;
  }

  private prendiCaroselloNovitaService(): CaroselloNovitaService | null {
    return this.injector.get(CaroselloNovitaService, null);
  }
}

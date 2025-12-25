import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import videojs from 'video.js';
import { TranslateService } from '@ngx-translate/core';
import { CambioLinguaService } from 'src/app/_servizi_globali/cambio-lingua.service';
import {
  CaroselloNovitaService,
  NovitaItem,
  NovitaInfo,
} from './carosello_services/carosello-novita.service';
import { CaricamentoCaroselloService } from './carosello_services/caricamento-carosello.service';
import { shareReplay } from 'rxjs/operators';
import { Subscription, combineLatest } from 'rxjs';



@Component({
  selector: 'app-carosello-novita',
  templateUrl: './carosello-novita.component.html',
  styleUrls: ['./carosello-novita.component.scss'],
})
export class CaroselloNovitaComponent implements OnInit, OnDestroy, AfterViewInit {
  alTop = true;
pausaPerScroll = false;
SCROLL_THRESHOLD = 10;
timerAutoscroll: any = null;
INTERVALLO_AUTOSCROLL_MS = 6200;
pausaPerBlur = false;
  immagini: string[] = [];
  descrizioni: string[] = [];
  titoliAlt: string[] = [];
chiaveStorageIndice = 'carosello_novita_ultima_slide_reale';
  imgTitolo: string[] = [];
  sottotitoli: string[] = [];

  titoloOverlay = '';
  imgTitoloOverlay = '';
  sottotitoloOverlay = '';

  titoloVisibile = true;
  sottotitoloVisibile = true;
  durataFadeTitoliMs = 200;
  pausaNeroTitoliMs = 50;

  private timerFadeTitolo: any = null;
  private timerImpostaTitolo: any = null;
  private idCambioTitoli = 0;
  private inBlackoutTitoli = false;
  private titoloPronto = false;

  indiceCorrente = 1;
  transizioneAttiva = true;
  stileTrasformazione = 'translateX(-100%)';
  scorrimentoInCorso = false;

  durataTransizioneMs = 500;
riproduttore: ElementRef | null = null;
playerInizializzato = false;

@ViewChild('riproduttore')
set riproduttoreViewChild(ref: ElementRef | null) {
  this.riproduttore = ref;
  this.inizializzaPlayerSePronto();
}

  player: any;
  mostraVideo = false;

  durataFadeAudioMs = 350;
  durataFadeVisivoMs = 250;
  RITARDO_MOSTRA_PLAYER_MS = 1250;

  timerMostra: any = null;
numeroSequenzaAvvio = 0;

tentativiTrailer = 0;
MAX_TENTATIVI_TRAILER = 2;


    contestoAudio: any = null;
  nodoSorgente: any = null;
  nodoGuadagno: any = null;
  elementoVideoReale: any = null;
  audioConsentito = false;

  sbloccoAudioAttivo = false;
  sbloccaAudioBinding: any = null;

   sfondiCaricati: Record<number, boolean> = {};
  contaSfondiCaricati = 0;
  logSfondiFatto = false;
  logTitoliFatto = false;

  segnalatiTitoliPronti = false;



  mappaNovitaCorrente: Record<string, NovitaInfo> = {};
  trailers: string[] = [];

    private subs = new Subscription();

 private idCambioLinguaVideo = 0;
 private promessaStopCambioLingua: Promise<void> | null = null;



        constructor(
    private caroselloNovitaService: CaroselloNovitaService,
    private cambioLinguaService: CambioLinguaService,
    private translate: TranslateService,
    private caricamentoCaroselloService: CaricamentoCaroselloService,
  ) {}



  ngOnInit(): void {
    this.caricaDati();

this.subs.add(
  this.cambioLinguaService.cambioLinguaAvviato$.subscribe(() => {
    // annulla eventuali Promise/timer in corso
    this.idCambioTitoli++;
    if (this.timerFadeTitolo) clearTimeout(this.timerFadeTitolo);
    if (this.timerImpostaTitolo) clearTimeout(this.timerImpostaTitolo);

    // NON fare blackout qui: tieni visibile la vecchia immagine
    this.inBlackoutTitoli = false;
    // lascia titoloVisibile/sottotitoloVisibile invariati

   // VIDEO: fade-out come lo scorrimento (niente taglio secco)
   const token = ++this.idCambioLinguaVideo;
   this.mostraVideo = false;
   this.fermaAvvioPendete();

   this.promessaStopCambioLingua = this.sfumaGuadagnoVerso(0, this.durataFadeAudioMs).finally(() => {
     if (token !== this.idCambioLinguaVideo) return;
     try { this.player.pause(); } catch {}
     try { this.player.currentTime(0); } catch {}
   });
  })
);



  this.subs.add(
  this.cambioLinguaService.cambioLinguaApplicata$.subscribe(
    ({ mappaNovita }) => {
      this.titoliAlt = this.descrizioni.map(
        (d) => mappaNovita[d]?.titolo || ''
      );
      this.imgTitolo = this.descrizioni.map(
        (d) => mappaNovita[d]?.img_titolo || ''
      );
      this.sottotitoli = this.descrizioni.map(
        (d) => mappaNovita[d]?.sottotitolo || ''
      );

      this.mappaNovitaCorrente = mappaNovita;
      this.trailers = this.descrizioni.map((d) => mappaNovita[d]?.trailer || '');

      this.aggiornaOverlayPerIndiceCorrente(this.indiceCorrente, true);

     // aspetta che finisca il fade-out del cambio lingua, poi riparti
     const token = this.idCambioLinguaVideo;
     const stop = this.promessaStopCambioLingua;
     this.promessaStopCambioLingua = null;

     (stop ?? Promise.resolve()).finally(() => {
       if (token !== this.idCambioLinguaVideo) return;
       this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
     });
    }
  )
);


  }

   ngAfterViewInit(): void {
  this.inizializzaPlayerSePronto();
}



  ngOnDestroy(): void {
    this.fermaAvvioPendete();
    this.fermaAutoscroll();

    try {
      this.rimuoviAscoltoSbloccoAudio();
    } catch {}

    try {
      if (this.nodoSorgente) this.nodoSorgente.disconnect();
    } catch {}
    try {
      if (this.nodoGuadagno) this.nodoGuadagno.disconnect();
    } catch {}
    try {
      if (this.contestoAudio && this.contestoAudio.state !== 'closed') this.contestoAudio.close();
    } catch {}

    try {
      if (this.player) this.player.dispose();
    } catch {}

    this.subs.unsubscribe();
  }


    caricaDati(): void {
  const giaPronto = this.caricamentoCaroselloService.caroselloPronto$.value;
  if (!giaPronto) this.caricamentoCaroselloService.resetta();
  this.segnalatiTitoliPronti = giaPronto;

  const lang = this.cambioLinguaService.leggiCodiceLingua();

  const novita$ = this.caroselloNovitaService.getNovita().pipe(shareReplay(1));
  const mappa$ = this.caroselloNovitaService.getInfoNovitaMap(lang).pipe(shareReplay(1));

  // 1) appena arrivano le novita, aggancio subito gli sfondi (download parte subito)
  this.subs.add(
    novita$.subscribe({
      next: (elencoOrdinato: NovitaItem[]) => {
        this.immagini = elencoOrdinato.map((x) => x.img_sfondo);
        this.descrizioni = elencoOrdinato.map((x) => x.descrizione || '');

        this.sfondiCaricati = {};
        this.logSfondiFatto = false;

        if (this.immagini.length > 0) {
            // RIPRESA SLIDE: se presente in localStorage, riparti da li' (indice reale 0-based)
  const indiceSalvato = this.leggiIndiceRealeDaStorage();
  if (indiceSalvato !== null) {
    const len = this.immagini.length;
    const clamp = Math.max(0, Math.min(indiceSalvato, Math.max(0, len - 1)));
    this.indiceCorrente = clamp + 1; // 1-based (prima slide reale)
  } else {
    this.indiceCorrente = 1;
  }

  this.transizioneAttiva = false;
  this.stileTrasformazione = `translateX(-${this.indiceCorrente * 100}%)`;

          this.impostaIndiciSfondiCritici(); // 👈 nuovo

          this.provaAvvioInizialeTrailer();
        } else {
          if (!giaPronto) {
            this.caricamentoCaroselloService.segnalaSfondiPronti();
            this.caricamentoCaroselloService.segnalaTitoliPronti();
            this.segnalatiTitoliPronti = true;
          }
        }
      },
      error: (err) => console.error('Errore nel caricamento novita', err),
    })
  );

  // 2) quando ho sia elenco che mappa, preparo titoli/trailer
  this.subs.add(
    combineLatest([novita$, mappa$]).subscribe(([elencoOrdinato, mappa]) => {
      const descr = elencoOrdinato.map((x) => x.descrizione || '');

      this.mappaNovitaCorrente = mappa;
      this.titoliAlt = descr.map((d) => mappa[d]?.titolo || '');
      this.imgTitolo = descr.map((d) => mappa[d]?.img_titolo || '');
      this.sottotitoli = descr.map((d) => mappa[d]?.sottotitolo || '');
      this.trailers = descr.map((d) => mappa[d]?.trailer || '');

      // prima paint: niente attesa fade+pausa+preload
      this.aggiornaOverlayPerIndiceCorrente(this.indiceCorrente, false);
      this.provaAvvioInizialeTrailer();
    })
  );
}
// + aggiungi questi HostListener (vicino a quello dello scroll)
@HostListener('window:blur', [])
gestisciBlurFinestra(): void {
  // blocca qualsiasi autoscroll e resetta il timer
  this.fermaAutoscroll();

  // se c'era video attivo: stop con fade come "scendo"
  if (!this.player) return;
  if (this.pausaPerBlur) return;

  this.pausaPerBlur = true;

  this.fermaAvvioPendete();
  this.numeroSequenzaAvvio++;

  this.mostraVideo = false;

  this.sfumaGuadagnoVerso(0, this.durataFadeAudioMs).finally(() => {
    try { this.player.pause(); } catch {}
    try { this.player.currentTime(0); } catch {}
  });
}

@HostListener('window:focus', [])
gestisciFocusFinestra(): void {
  if (!this.pausaPerBlur) return;
  this.pausaPerBlur = false;

  // reset "tempo autoscroll": riparti da zero solo se NON sei al top
  if (!this.alTop) {
    this.avviaAutoscroll();
    return;
  }

  // se sei al top, puoi ripartire col trailer corrente
  if (this.player && !this.pausaPerScroll) {
    this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
  }
}

@HostListener('window:scroll', [])
gestisciScroll(): void {
  const y = window.pageYOffset || document.documentElement.scrollTop || 0;
  const inCima = y <= this.SCROLL_THRESHOLD;

  if (inCima === this.alTop) return; // nessun cambio stato

  this.alTop = inCima;

  if (!inCima) {
    this.onUscitaDalTop();
  } else {
    this.onRitornoAlTop();
  }
}




 vaiAvanti(daAutoscroll: boolean = false): void {
  this.avviaCambioSlideConFade(() => {
    if (this.scorrimentoInCorso || this.immagini.length === 0) return;
    this.scorrimentoInCorso = true;

    // se non sono al top, qualsiasi movimento (manuale o auto) resetta il timer:
    // lo fermo subito per evitare che scatti durante la transizione
    if (!this.alTop) this.fermaAutoscroll();

    const prossimo = this.indiceCorrente + 1;

    this.aggiornaOverlayPerIndiceCorrente(prossimo, true);

    this.indiceCorrente = prossimo;
    this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
    this.aggiornaTrasformazione(true);

    const chiudi = () => {
      this.scorrimentoInCorso = false;

      // video solo al top
      if (this.alTop && !this.pausaPerScroll) {
        this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
      } else {
        this.mostraVideo = false;

        // se non sono al top: riparte da zero l'autoscroll (manuale o auto)
        this.avviaAutoscroll();
      }
    };

    if (this.indiceCorrente > this.immagini.length) {
      setTimeout(() => {
        this.transizioneAttiva = false;
        this.indiceCorrente = 1;
         this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
        this.aggiornaTrasformazione(false);
        chiudi();
      }, this.durataTransizioneMs);
    } else {
      setTimeout(() => {
        chiudi();
      }, this.durataTransizioneMs);
    }
  });
}



 vaiIndietro(): void {
  this.avviaCambioSlideConFade(() => {
    if (this.scorrimentoInCorso || this.immagini.length === 0) return;
    this.scorrimentoInCorso = true;

    if (!this.alTop) this.fermaAutoscroll();

    const prossimo = this.indiceCorrente - 1;

    this.aggiornaOverlayPerIndiceCorrente(prossimo, true);

    this.indiceCorrente = prossimo;
    this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
    this.aggiornaTrasformazione(true);

    const chiudi = () => {
      this.scorrimentoInCorso = false;

      if (this.alTop && !this.pausaPerScroll) {
        this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
      } else {
        this.mostraVideo = false;
        this.avviaAutoscroll();
      }
    };

    if (this.indiceCorrente === 0) {
      setTimeout(() => {
        this.transizioneAttiva = false;
        this.indiceCorrente = this.immagini.length;
        this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
        this.aggiornaTrasformazione(false);
        chiudi();
      }, this.durataTransizioneMs);
    } else {
      setTimeout(() => {
        chiudi();
      }, this.durataTransizioneMs);
    }
  });
}



 selezionaIndice(indiceZeroBased: number): void {
  this.avviaCambioSlideConFade(() => {
    if (this.scorrimentoInCorso || this.immagini.length === 0) return;

    const prossimo = indiceZeroBased + 1;
    if (prossimo === this.indiceCorrente) return;

    this.scorrimentoInCorso = true;

    if (!this.alTop) this.fermaAutoscroll();

    this.aggiornaOverlayPerIndiceCorrente(prossimo, true);

    this.indiceCorrente = prossimo;
    this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
    this.aggiornaTrasformazione(true);

    setTimeout(() => {
      this.scorrimentoInCorso = false;

      if (this.alTop && !this.pausaPerScroll) {
        this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
      } else {
        this.mostraVideo = false;
        this.avviaAutoscroll();
      }
    }, this.durataTransizioneMs);
  });
}



  aggiornaTrasformazione(conAnimazione: boolean): void {
    this.transizioneAttiva = conAnimazione;
    this.stileTrasformazione = `translateX(-${this.indiceCorrente * 100}%)`;
  }

    fermaAvvioPendete(): void {
    if (this.timerMostra) {
      clearTimeout(this.timerMostra);
      this.timerMostra = null;
    }
    this.numeroSequenzaAvvio++;
  }

    provaAvvioInizialeTrailer(): void {
   if (!this.player) return;
   if (!this.immagini.length) return;
   if (!this.trailers.length) return;
   this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
 }



  getPrevTitolo(): string {
    if (!this.titoliAlt.length || !this.immagini.length) return '';
    const len = this.immagini.length;
    const currentIndex = (this.indiceCorrente - 1 + len) % len;
    const prevIndex = (currentIndex - 1 + len) % len;
    return this.titoliAlt[prevIndex] || '';
  }

  getNextTitolo(): string {
    if (!this.titoliAlt.length || !this.immagini.length) return '';
    const len = this.immagini.length;
    const currentIndex = (this.indiceCorrente - 1 + len) % len;
    const nextIndex = (currentIndex + 1) % len;
    return this.titoliAlt[nextIndex] || '';
  }

  private aggiornaTestiPerLingua(lang: string): void {
   this.caroselloNovitaService.getInfoNovitaMap(lang).subscribe((mappa) => {
  this.titoliAlt = this.descrizioni.map((d) => mappa[d]?.titolo || '');
  this.imgTitolo = this.descrizioni.map((d) => mappa[d]?.img_titolo || '');
  this.sottotitoli = this.descrizioni.map((d) => mappa[d]?.sottotitolo || '');

  this.mappaNovitaCorrente = mappa;
  this.trailers = this.descrizioni.map((d) => mappa[d]?.trailer || '');

  this.aggiornaOverlayPerIndiceCorrente(this.indiceCorrente, true);

  this.riavviaTrailerCorrenteDopoCambioLingua();
});

  }

  private getIndiceRealeZeroBased(): number {
    if (!this.immagini.length) return 0;
    const len = this.immagini.length;
    return (this.indiceCorrente - 1 + len) % len;
  }

  getTitoloCorrente(): string {
    if (!this.titoliAlt.length) return '';
    return this.titoliAlt[this.getIndiceRealeZeroBased()] || '';
  }

  getImgTitoloCorrente(): string {
    if (!this.imgTitolo.length) return '';
    return this.imgTitolo[this.getIndiceRealeZeroBased()] || '';
  }

  getSottotitoloCorrente(): string {
    if (!this.sottotitoli.length) return '';
    return this.sottotitoli[this.getIndiceRealeZeroBased()] || '';
  }

  private aggiornaOverlayPerIndiceCorrente(
    indiceCorrenteNuovo: number,
    conTransizione: boolean
  ): void {
    const len = this.immagini.length;
    if (!len) return;

    const indiceReale = (indiceCorrenteNuovo - 1 + len) % len;

    const nuovoTitolo = this.titoliAlt[indiceReale] || '';
    const nuovaImgTitolo = this.imgTitolo[indiceReale] || '';
    const nuovoSottotitolo = this.sottotitoli[indiceReale] || '';

    this.impostaOverlay(
      nuovoTitolo,
      nuovaImgTitolo,
      nuovoSottotitolo,
      conTransizione
    );
  }

    private impostaOverlay(
    nuovoTitolo: string,
    nuovaImgTitolo: string,
    nuovoSottotitolo: string,
    conTransizione: boolean
  ): void {
    if (!conTransizione) {
      this.inBlackoutTitoli = false;
      this.titoloPronto = !nuovaImgTitolo;
      this.titoloOverlay = nuovoTitolo;
      this.imgTitoloOverlay = nuovaImgTitolo;
      this.sottotitoloOverlay = nuovoSottotitolo;
      this.titoloVisibile = true;
      this.sottotitoloVisibile = true;

      if (this.titoloPronto && !this.segnalatiTitoliPronti) {
        this.segnalatiTitoliPronti = true;
        this.caricamentoCaroselloService.segnalaTitoliPronti();
      }

      return;
    }

    if (this.timerFadeTitolo) clearTimeout(this.timerFadeTitolo);
    if (this.timerImpostaTitolo) clearTimeout(this.timerImpostaTitolo);

    const token = ++this.idCambioTitoli;
    this.inBlackoutTitoli = true;
    this.titoloPronto = !nuovaImgTitolo;

    this.titoloVisibile = false;
    this.sottotitoloVisibile = false;

    if (this.titoloPronto && !this.segnalatiTitoliPronti) {
      this.segnalatiTitoliPronti = true;
      this.caricamentoCaroselloService.segnalaTitoliPronti();
    }

    const attesaFineFade = new Promise<void>((res) =>
      setTimeout(res, this.durataFadeTitoliMs)
    );
    const attesaPausaNero = new Promise<void>((res) =>
      setTimeout(res, this.pausaNeroTitoliMs)
    );
    const attesaPreload = this.precaricaImmagine(nuovaImgTitolo);

    Promise.all([attesaFineFade, attesaPausaNero, attesaPreload]).then(() => {
      if (token !== this.idCambioTitoli) return;

      this.titoloOverlay = nuovoTitolo;
      this.imgTitoloOverlay = nuovaImgTitolo;
      this.sottotitoloOverlay = nuovoSottotitolo;

      requestAnimationFrame(() => {
        if (token !== this.idCambioTitoli) return;
        this.inBlackoutTitoli = false;

        if (this.titoloPronto) {
          this.titoloVisibile = true;
          this.sottotitoloVisibile = true;
        }
      });
    });
  }


     segnalaTitoloCaricato(): void {
    this.titoloPronto = true;

    if (!this.logTitoliFatto && this.imgTitoloOverlay) {
      this.logTitoliFatto = true;
      console.log('TITOLI PRONTI alle ' + performance.now() + ' ms');
    }

    if (!this.segnalatiTitoliPronti) {
      this.segnalatiTitoliPronti = true;
      this.caricamentoCaroselloService.segnalaTitoliPronti();
    }

    if (!this.inBlackoutTitoli) {
      this.titoloVisibile = true;
      this.sottotitoloVisibile = true;
    }
  }



      private precaricaImmagine(url: string): Promise<void> {
    return new Promise((ok) => {
      if (!url) return ok();
      const img = new Image();
      img.src = url;
      if (img.complete) return ok();
      img.onload = img.onerror = () => ok();
    });
  }

  segnalaSfondoCaricato(indice: number): void {
  if (this.logSfondiFatto) return;
  if (!this.immagini || this.immagini.length === 0) return;
  if (this.sfondiCaricati[indice]) return;

  this.sfondiCaricati[indice] = true;

  // 👇 basta che siano pronti quelli che servono subito (cur/prev/next)
  if (this.sfondiCriticiPronti()) {
    this.logSfondiFatto = true;
    console.log('SFONDI CRITICI PRONTI alle ' + performance.now() + ' ms');
    this.caricamentoCaroselloService.segnalaSfondiPronti();
  }
}




  avviaCambioSlideConFade(azioneScorrimento: () => void): void {
    if (!this.player) {
      azioneScorrimento();
      return;
    }

    this.mostraVideo = false;
    this.fermaAvvioPendete();

    const fade = this.sfumaGuadagnoVerso(0, this.durataFadeAudioMs);

    azioneScorrimento();

    fade.finally(() => {
      try { this.player.pause(); } catch {}
      try { this.player.currentTime(0); } catch {}
    });
  }

  avviaTrailerCorrenteDopo(ms: number): void {
  if (!this.player) return;
  if (!this.trailers || this.trailers.length === 0) return;

  // 👇 REGOLA: fuori dal top / pausa scroll / blur -> mai avvio video
  if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) {
    this.mostraVideo = false;
    return;
  }

  this.fermaAvvioPendete();

  const len = this.immagini.length;
  const indiceReale = (this.indiceCorrente - 1 + len) % len;
  const urlTrailer = this.trailers[indiceReale] || '';

  if (!urlTrailer) {
    this.mostraVideo = false;
    return;
  }

    const token = ++this.numeroSequenzaAvvio;

  this.mostraVideo = false;
  this.sfumaGuadagnoVerso(0, 0);

  try { this.player.pause(); } catch {}
  try { this.player.currentTime(0); } catch {}

  // reset retry per questo trailer
  this.tentativiTrailer = 0;

  this.attendiCopertureNonVisibili().then(() => {
    if (token !== this.numeroSequenzaAvvio) return;

    this.timerMostra = setTimeout(async () => {
      this.timerMostra = null;

      if (token !== this.numeroSequenzaAvvio) return;

      // ricontrollo: magari nel frattempo hai scrollato giu' / blur
      if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) {
        this.mostraVideo = false;
        return;
      }

      await this.caricaTrailerEAvvia(urlTrailer, token);
    }, Math.max(0, ms));
  });

}


  collegaFineTrailer(): void {
    try {
      if (!this.player) return;
      this.player.off('ended');
    } catch {}

    try {
     this.player.on('ended', () => {
  this.mostraVideo = false;
  this.fermaAvvioPendete();

  this.sfumaGuadagnoVerso(0, this.durataFadeAudioMs).finally(() => {
    try { this.player.pause(); } catch {}
    try { this.player.currentTime(0); } catch {}

    this.vaiAvantiDaFineTrailer();
  });
});

    } catch {}
  }

  riavviaTrailerCorrenteDopoCambioLingua(): void {
    if (!this.player) return;
    if (!this.trailers || this.trailers.length === 0) return;

    this.mostraVideo = false;
    this.fermaAvvioPendete();

    this.sfumaGuadagnoVerso(0, this.durataFadeAudioMs).finally(() => {
      try { this.player.pause(); } catch {}
      try { this.player.currentTime(0); } catch {}

      this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
    });
  }

  tentaAutoplayConAudio(): void {
    try {
      this.impostaMuteReale(false);

      const promessa = this.player.play();
      if (promessa && typeof promessa.then === 'function') {
        promessa
          .then(() => {
            this.audioConsentito = true;
            this.inizializzaWebAudioSuVideoReale();
          })
          .catch(() => {
            this.avviaMutatoConOpzioneSblocco(true);
          });
      } else {
        setTimeout(() => {
          try {
            if (this.player && typeof this.player.paused === 'function' && this.player.paused()) {
              this.avviaMutatoConOpzioneSblocco(true);
            }
          } catch {
            this.avviaMutatoConOpzioneSblocco(true);
          }
        }, 0);
      }
    } catch {
      this.avviaMutatoConOpzioneSblocco(true);
    }
  }

  avviaMutatoConOpzioneSblocco(consentiSblocco: boolean): void {
    try {
      this.impostaMuteReale(true);

      const p = this.player.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch {}

    if (consentiSblocco) this.preparaSbloccoAudioSuInterazione();
  }

  preparaSbloccoAudioSuInterazione(): void {
    if (this.sbloccoAudioAttivo) return;
    this.sbloccoAudioAttivo = true;

    this.sbloccaAudioBinding = (_ev: Event) => {
      this.rimuoviAscoltoSbloccoAudio();

      try {
        this.audioConsentito = true;
        this.inizializzaWebAudioSuVideoReale();
        this.impostaMuteReale(false);

        try { this.player.pause(); } catch {}
        try { this.player.currentTime(0); } catch {}

        this.player.one('playing', () => {
          this.sfumaGuadagnoVerso(1, this.durataFadeAudioMs);
        });

        const p = this.player.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            this.impostaMuteReale(true);
          });
        }
      } catch {
        this.impostaMuteReale(true);
      }
    };

    document.addEventListener('click', this.sbloccaAudioBinding as any, {
      passive: true,
      once: true,
    });
  }

  rimuoviAscoltoSbloccoAudio(): void {
    if (!this.sbloccoAudioAttivo) return;
    this.sbloccoAudioAttivo = false;

    if (this.sbloccaAudioBinding) {
      document.removeEventListener('click', this.sbloccaAudioBinding as any);
      this.sbloccaAudioBinding = null;
    }
  }

  inizializzaWebAudioSuVideoReale(): void {
    try {

      if (!this.contestoAudio) {
        this.contestoAudio = new (window as any).AudioContext();
      }
      const el = this.ottieniElementoVideoReale();
      if (!el) return;
      this.collegaWebAudioAlVideo(el);
    } catch {}
  }

  ottieniElementoVideoReale(): any {
    try {
      if (!this.player || !this.player.el) return null;
      const root = this.player.el() as HTMLElement;
      const elVideo = root.querySelector('video');
      return elVideo || null;
    } catch {
      return null;
    }
  }

  collegaWebAudioAlVideo(elVideo: any): void {
    if (!elVideo) return;
    if (this.elementoVideoReale === elVideo && this.nodoSorgente && this.nodoGuadagno) return;

    try {
      this.applicaAttributiVideoReale();

      if (this.nodoSorgente) {
        try { this.nodoSorgente.disconnect(); } catch {}
      }
      if (this.nodoGuadagno) {
        try { this.nodoGuadagno.disconnect(); } catch {}
      }

      this.elementoVideoReale = elVideo;
      this.nodoSorgente = this.contestoAudio.createMediaElementSource(this.elementoVideoReale);
      this.nodoGuadagno = this.contestoAudio.createGain();
      this.nodoGuadagno.gain.value = 1;

      this.nodoSorgente.connect(this.nodoGuadagno).connect(this.contestoAudio.destination);
    } catch {}
  }

  verificaRicollegamentoVideo(): void {
    const el = this.ottieniElementoVideoReale();
    if (el && el !== this.elementoVideoReale) {
      this.applicaAttributiVideoReale();
      this.collegaWebAudioAlVideo(el);
    }
  }

  sfumaGuadagnoVerso(target: number, durataMs: number): Promise<void> {
    return new Promise((risolvi) => {
      try {
        if (!this.audioConsentito || !this.contestoAudio || !this.nodoGuadagno) return risolvi();

        const avviaRamp = () => {
          const t0 = this.contestoAudio.currentTime;
          const sec = Math.max(0, (durataMs || 0) / 1000);
          const clamped = Math.max(0, Math.min(1, target));
          const valoreAttuale = this.nodoGuadagno.gain.value;

          this.nodoGuadagno.gain.cancelScheduledValues(t0);
          this.nodoGuadagno.gain.setValueAtTime(valoreAttuale, t0);
          this.nodoGuadagno.gain.linearRampToValueAtTime(clamped, t0 + sec);

          setTimeout(() => risolvi(), durataMs || 0);
        };

        if (this.contestoAudio.state === 'suspended') {
           try { this.contestoAudio.resume().catch(() => {}); } catch {}
 avviaRamp();
        } else {
          avviaRamp();
        }
      } catch {
        risolvi();
      }
    });
  }

  applicaAttributiVideoReale(): void {
    try {
      const el = this.ottieniElementoVideoReale();
      if (!el) return;
      el.setAttribute('crossorigin', 'anonymous');
      el.setAttribute('playsinline', '');
    } catch {}
  }

  impostaMuteReale(attivo: boolean): void {
    try {
      const el = this.ottieniElementoVideoReale();
      if (el) {
        el.muted = attivo;
        if (attivo) el.setAttribute('muted', '');
        else el.removeAttribute('muted');
      }
      if (this.player && typeof this.player.muted === 'function') {
        this.player.muted(!!attivo);
      }
    } catch {}
  }

vaiAvantiDaFineTrailer(): void {
  if (this.scorrimentoInCorso || this.immagini.length === 0) return;
  this.scorrimentoInCorso = true;

  const prossimo = this.indiceCorrente + 1;

  this.aggiornaOverlayPerIndiceCorrente(prossimo, true);

  this.indiceCorrente = prossimo;
  this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
  this.aggiornaTrasformazione(true);

  const chiudi = () => {
    this.scorrimentoInCorso = false;

    if (this.alTop && !this.pausaPerScroll) {
      this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
    } else {
      this.mostraVideo = false;
    }
  };

  if (this.indiceCorrente > this.immagini.length) {
    setTimeout(() => {
      this.transizioneAttiva = false;
      this.indiceCorrente = 1;
      this.salvaIndiceRealeInStorage(this.getIndiceRealeZeroBased());
      this.aggiornaTrasformazione(false);
      chiudi();
    }, this.durataTransizioneMs);
  } else {
    setTimeout(() => {
      chiudi();
    }, this.durataTransizioneMs);
  }
}
inizializzaPlayerSePronto(): void {
  if (this.playerInizializzato) return;
  if (!this.riproduttore || !this.riproduttore.nativeElement) return;

  this.playerInizializzato = true;

  this.player = videojs(this.riproduttore.nativeElement, {
    autoplay: false,
    muted: false,
    controls: false,
    loop: false,
    preload: 'auto',
    playsinline: true,
  });

  try { this.player.autoplay && this.player.autoplay(false); } catch {}

  this.mostraVideo = false;

    this.player.on('techready', () => this.verificaRicollegamentoVideo());

  this.player.on('loadstart', () => {
    this.verificaRicollegamentoVideo();
    this.tentativiTrailer = 0;
  });

  // Firefox: se si blocca in waiting/stalled, fai retry soft
  this.player.on('stalled', () => this.pianificaControlloStallo(this.numeroSequenzaAvvio));
  this.player.on('waiting', () => this.pianificaControlloStallo(this.numeroSequenzaAvvio));
  this.player.on('error',   () => this.pianificaControlloStallo(this.numeroSequenzaAvvio));

  this.collegaFineTrailer();
  this.provaAvvioInizialeTrailer();
}


private copertureAncoraVisibili(): boolean {
  const selettori = [
    'app-saturno',
    'app-sfondo',
    '.loading-overlay', // se esiste ancora
  ];

  for (const sel of selettori) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) continue;

    const st = window.getComputedStyle(el);
    const op = Number(st.opacity || '1');

    const visibile =
      st.display !== 'none' &&
      st.visibility !== 'hidden' &&
      op > 0.01;

    if (visibile) return true;
  }

  return false;
}

private attendiCopertureNonVisibili(timeoutMs: number = 8000): Promise<void> {
  return new Promise((resolve) => {
    if (!this.copertureAncoraVisibili()) return resolve();

    let finito = false;
    const t0 = performance.now();

    const stop = () => {
      if (finito) return;
      finito = true;
      try { obs.disconnect(); } catch {}
      resolve();
    };

    const check = () => {
      if (finito) return;

      const elapsed = performance.now() - t0;
      if (elapsed >= timeoutMs) return stop(); // fallback

      if (!this.copertureAncoraVisibili()) return stop();

      requestAnimationFrame(check);
    };

    const obs = new MutationObserver(() => {
      if (!finito && !this.copertureAncoraVisibili()) stop();
    });

    try {
      obs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    } catch {}

    requestAnimationFrame(check);
  });
}
indiciSfondiCritici: number[] = [];

private impostaIndiciSfondiCritici(): void {
  const len = this.immagini.length;
  if (!len) { this.indiciSfondiCritici = []; return; }

  const cur = this.getIndiceRealeZeroBased();
  const prev = (cur - 1 + len) % len;
  const next = (cur + 1) % len;

  this.indiciSfondiCritici = Array.from(new Set([cur, prev, next]));
}

private sfondiCriticiPronti(): boolean {
  if (!this.indiciSfondiCritici.length) return true;
  return this.indiciSfondiCritici.every((i) => !!this.sfondiCaricati[i]);
}

private onUscitaDalTop(): void {
  if (!this.player || this.pausaPerScroll) return;

  this.pausaPerScroll = true;

  this.fermaAvvioPendete();
  this.numeroSequenzaAvvio++;

  this.mostraVideo = false;

  this.sfumaGuadagnoVerso(0, this.durataFadeAudioMs).finally(() => {
    try { this.player.pause(); } catch {}
    try { this.player.currentTime(0); } catch {}
  });

  // 👇 AUTOSCROLL: riparte da zero
  this.avviaAutoscroll();
}



private onRitornoAlTop(): void {
  if (!this.player || !this.pausaPerScroll) return;

  this.pausaPerScroll = false;

  // 👇 AUTOSCROLL: STOP + RESET
  this.fermaAutoscroll();

  try { this.player.currentTime(0); } catch {}

  this.avviaTrailerCorrenteDopo(this.RITARDO_MOSTRA_PLAYER_MS);
}

private avviaAutoscroll(): void {
  // solo se non sono al top
  if (this.alTop) return;

  this.fermaAutoscroll(); // reset SEMPRE

  this.timerAutoscroll = setTimeout(() => {
    this.timerAutoscroll = null;

    // guardie
    if (this.alTop) return;

    // se sto gia' scorrendo, ripianifica e basta
    if (this.scorrimentoInCorso) {
      this.avviaAutoscroll();
      return;
    }

    // IMPORTANTISSIMO:
    // NON richiamare qui avviaAutoscroll() ricorsivo.
    // Lo fa vaiAvanti() a fine transizione.
    this.vaiAvanti(true);
  }, this.INTERVALLO_AUTOSCROLL_MS);
}

private fermaAutoscroll(): void {
  if (this.timerAutoscroll) {
    clearTimeout(this.timerAutoscroll);
    this.timerAutoscroll = null;
  }
}
// + aggiungi helper (in fondo o dove preferisci)
leggiIndiceRealeDaStorage(): number | null {
  try {
    const v = window && window.localStorage
      ? window.localStorage.getItem(this.chiaveStorageIndice)
      : null;
    if (v === null) return null;
    const n = Number(v);
    return Number.isInteger(n) ? n : null;
  } catch {
    return null;
  }
}

salvaIndiceRealeInStorage(indiceReale: number): void {
  try {
    if (window && window.localStorage) {
      window.localStorage.setItem(this.chiaveStorageIndice, String(indiceReale));
    }
  } catch {}
}

private attendiEventoPlayer(evento: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!this.player) return resolve(false);

    let finito = false;

    const onEv = () => stop(true);

    const stop = (ok: boolean) => {
      if (finito) return;
      finito = true;
      try { this.player.off(evento, onEv); } catch {}
      resolve(ok);
    };

    try { this.player.one(evento, onEv); } catch { return resolve(false); }

    setTimeout(() => stop(false), Math.max(0, timeoutMs));
  });
}

private pianificaControlloStallo(token: number): void {
  setTimeout(() => {
    if (token !== this.numeroSequenzaAvvio) return;
    if (!this.player) return;

    // se sei uscito dal top o sei in pausa logica, non fare nulla
    if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) return;

    try {
      const err = this.player.error && this.player.error();
      if (err) {
        this.riprovaTrailerCorrente(token);
        return;
      }

      const rs = typeof this.player.readyState === 'function' ? this.player.readyState() : 0;
      const paused = typeof this.player.paused === 'function' ? this.player.paused() : true;

      // readyState <= 2: metadata o meno, facile che sia bloccato
      if (!paused && rs <= 2) {
        this.riprovaTrailerCorrente(token);
      }
    } catch {}
  }, 2500);
}

private riprovaTrailerCorrente(token: number): void {
  if (token !== this.numeroSequenzaAvvio) return;
  if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) return;
  if (this.tentativiTrailer >= this.MAX_TENTATIVI_TRAILER) return;

  this.tentativiTrailer++;

  const len = this.immagini.length;
  const indiceReale = (this.indiceCorrente - 1 + len) % len;
  const urlTrailer = this.trailers[indiceReale] || '';
  if (!urlTrailer) return;

  this.caricaTrailerEAvvia(urlTrailer, token);
}

private async caricaTrailerEAvvia(urlTrailer: string, token: number): Promise<void> {
  if (!this.player) return;

  // reset pulito prima del src
  this.mostraVideo = false;
  this.sfumaGuadagnoVerso(0, 0);

  try { this.player.pause(); } catch {}
  try { this.player.currentTime(0); } catch {}

  try {
    this.player.src({ src: urlTrailer, type: 'video/mp4' });
    try { this.player.load?.(); } catch {}
    this.applicaAttributiVideoReale();
  } catch {
    return;
  }

  // aspetta metadata e canplay (Firefox spesso ne ha bisogno)
  await this.attendiEventoPlayer('loadedmetadata', 4000);
  if (token !== this.numeroSequenzaAvvio) return;

  // micro workaround: forza tiny seek
  try { this.player.currentTime(0.01); } catch {}

  const okCanPlay = await this.attendiEventoPlayer('canplay', 6000);
  if (token !== this.numeroSequenzaAvvio) return;

  if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) {
    this.mostraVideo = false;
    return;
  }

  this.mostraVideo = true;

// PREPARA WebAudio PRIMA del play (non blocca: niente await su resume)
this.inizializzaWebAudioSuVideoReale();
try {
  if (this.nodoGuadagno && this.contestoAudio) {
    const t0 = this.contestoAudio.currentTime;
    this.nodoGuadagno.gain.cancelScheduledValues(t0);
    this.nodoGuadagno.gain.setValueAtTime(0, t0);
  }
} catch {}

// micro-delay: aiuta il caso /login (audio che “parte in sync”)
await new Promise((r) => setTimeout(r, 140));
if (token !== this.numeroSequenzaAvvio) return;
if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) {
  this.mostraVideo = false;
  return;
}

this.player.one('playing', () => {
  if (token !== this.numeroSequenzaAvvio) return;
  if (!this.alTop || this.pausaPerScroll || this.pausaPerBlur) return;
  // qui e' davvero partito: da ora possiamo considerare l'audio “consentito”
  this.audioConsentito = true;
  try {
    if (this.contestoAudio && this.contestoAudio.state === 'suspended') {
      this.contestoAudio.resume().catch(() => {});
    }
  } catch {}
  this.sfumaGuadagnoVerso(1, this.durataFadeAudioMs);
});

// tenta play con audio; se non permesso -> fallback mutato + sblocco (come prima)
try {
  this.impostaMuteReale(false);
  const p = this.player.play();
  if (p && typeof p.then === 'function') {
    p.catch(() => {
      this.avviaMutatoConOpzioneSblocco(true);
    });
  }
} catch {
  this.avviaMutatoConOpzioneSblocco(true);
}

// se canplay non e' arrivato (timeout), pianifica un controllo stallo
if (!okCanPlay) this.pianificaControlloStallo(token);

}


}

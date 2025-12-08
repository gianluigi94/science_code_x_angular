import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from 'src/app/_servizi_globali/api.service';
import { IRispostaServer } from 'src/app/_interfacce/IRispostaServer.interface';
import { film } from 'src/app/_type/film.type';
import { serie } from 'src/app/_type/serie.type';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-carosello-novita',
  templateUrl: './carosello-novita.component.html',
  styleUrls: ['./carosello-novita.component.scss'],
})
export class CaroselloNovitaComponent implements OnInit, OnDestroy {
  immagini: string[] = [];
  descrizioni: string[] = [];

  indiceCorrente = 1; // prima immagine reale (dopo il clone finale)
  transizioneAttiva = true;
  stileTrasformazione = 'translateX(-100%)';
  scorrimentoInCorso = false;

  durataTransizioneMs = 500;
  intervalloScorrimentoAutomaticoMs = 6200;
  timerScorrimento: any = null;
  numeroSequenza = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.caricaDati();
  }

  ngOnDestroy(): void {
    this.fermaScorrimentoAutomatico();
  }

  caricaDati(): void {
    const elencoFilm$ = this.api
      .getElencoFilm()
      .pipe(map((risp: IRispostaServer) => risp.data as film[]));

    const elencoSerie$ = this.api
      .getElencoSerie()
      .pipe(map((risp: IRispostaServer) => risp.data as serie[]));

    forkJoin([elencoFilm$, elencoSerie$])
      .pipe(
        map(([film, serie]) => {
          const filmNovita = film.filter((f) => f.novita && f.img_sfondo);
          const serieNovita = serie.filter((s) => s.novita && s.img_sfondo);
          const elenco = [...filmNovita, ...serieNovita];
          return this.ordinaNovita(elenco);
        })
      )
      .subscribe({
        next: (elencoOrdinato) => {
          this.immagini = elencoOrdinato.map((x) => x.img_sfondo);
          this.descrizioni = elencoOrdinato.map((x) => x.descrizione || '');
          if (this.immagini.length > 0) {
            this.indiceCorrente = 1;
            this.stileTrasformazione = 'translateX(-100%)';
            this.pianificaScorrimentoAutomatico();
          }
        },
      });
  }

  vaiAvanti(): void {
    if (this.scorrimentoInCorso || this.immagini.length === 0) return;
    this.scorrimentoInCorso = true;

    const prossimo = this.indiceCorrente + 1;
    this.indiceCorrente = prossimo;
    this.aggiornaTrasformazione(true);

    if (this.indiceCorrente > this.immagini.length) {
      // clone iniziale → torna alla prima reale
      setTimeout(() => {
        this.transizioneAttiva = false;
        this.indiceCorrente = 1;
        this.aggiornaTrasformazione(false);
        this.scorrimentoInCorso = false;
      }, this.durataTransizioneMs);
    } else {
      setTimeout(() => {
        this.scorrimentoInCorso = false;
      }, this.durataTransizioneMs);
    }

    this.ripristinaScorrimentoAutomatico();
  }

  vaiIndietro(): void {
    if (this.scorrimentoInCorso || this.immagini.length === 0) return;
    this.scorrimentoInCorso = true;

    const prossimo = this.indiceCorrente - 1;
    this.indiceCorrente = prossimo;
    this.aggiornaTrasformazione(true);

    if (this.indiceCorrente === 0) {
      // clone finale → torna all’ultima reale
      setTimeout(() => {
        this.transizioneAttiva = false;
        this.indiceCorrente = this.immagini.length;
        this.aggiornaTrasformazione(false);
        this.scorrimentoInCorso = false;
      }, this.durataTransizioneMs);
    } else {
      setTimeout(() => {
        this.scorrimentoInCorso = false;
      }, this.durataTransizioneMs);
    }

    this.ripristinaScorrimentoAutomatico();
  }

  selezionaIndice(indiceZeroBased: number): void {
    if (this.scorrimentoInCorso || this.immagini.length === 0) return;

    if (indiceZeroBased + 1 === this.indiceCorrente) return;

    this.scorrimentoInCorso = true;

    const prossimo = indiceZeroBased + 1;
    this.indiceCorrente = prossimo;
    this.aggiornaTrasformazione(true);

    setTimeout(() => {
      this.scorrimentoInCorso = false;
    }, this.durataTransizioneMs);

    this.ripristinaScorrimentoAutomatico();
  }

  aggiornaTrasformazione(conAnimazione: boolean): void {
    this.transizioneAttiva = conAnimazione;
    this.stileTrasformazione = `translateX(-${this.indiceCorrente * 100}%)`;
  }

  pianificaScorrimentoAutomatico(): void {
    if (this.immagini.length === 0) return;
    const token = ++this.numeroSequenza;
    this.timerScorrimento = setTimeout(() => {
      if (token !== this.numeroSequenza) return;

      if (!this.scorrimentoInCorso) {
        this.vaiAvanti();
      }

      if (token === this.numeroSequenza) {
        this.pianificaScorrimentoAutomatico();
      }
    }, this.intervalloScorrimentoAutomaticoMs);
  }

  ripristinaScorrimentoAutomatico(): void {
    this.fermaScorrimentoAutomatico();
    this.pianificaScorrimentoAutomatico();
  }

  fermaScorrimentoAutomatico(): void {
    if (this.timerScorrimento) {
      clearTimeout(this.timerScorrimento);
      this.timerScorrimento = null;
    }
    this.numeroSequenza++;
  }

  // queste sono le ULTIME SEI slide, nell'ordine da SINISTRA a DESTRA in coda al carosello
  ordineUltimeSei: string[] = [
    'serie.cavalli_contro_circuiti',
    'film.il_mio_gatto_nella_scatola',
    'film.l_era_dell_alchimia',
    'serie.rivelazioni_dalla_sonda_cassini',
    'serie.rna_e_la_memoria_cellulare',
    'film.il_lungo_volo_del_coraggio',
  ];

  ordinaNovita(elenco: any[]): any[] {
    // mappa descrizione -> posizione dentro le ultime sei
    const mappaUltimeSei = new Map<string, number>(
      this.ordineUltimeSei.map((descrizione, indice) => [descrizione, indice])
    );

    const altri: any[] = [];
    const ultimeSei: any[] = [];

    // separa elenco in "altri" e "ultime sei"
    for (const item of elenco) {
      if (mappaUltimeSei.has(item.descrizione)) {
        ultimeSei.push(item);
      } else {
        altri.push(item);
      }
    }

    // 1) gli ALTRI: ordinati per created_at DESC (più recente = prima slide)
    altri.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta; // dal più nuovo al più vecchio
    });

    // 2) le ULTIME SEI: nell'ordine fisso che vuoi tu
    ultimeSei.sort((a, b) => {
      const pa = mappaUltimeSei.get(a.descrizione) ?? 0;
      const pb = mappaUltimeSei.get(b.descrizione) ?? 0;
      return pa - pb;
    });

    // 3) risultato finale: prima tutti gli altri, poi le ultime sei
    return [...altri, ...ultimeSei];
  }
}

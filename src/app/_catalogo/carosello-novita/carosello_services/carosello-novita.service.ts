// carosello-novita.service.ts
// Percorso: _catalogo/carosello-novita/carosello_services/carosello-novita.service.ts

import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/_servizi_globali/api.service';
import { IRispostaServer } from 'src/app/_interfacce/IRispostaServer.interface';
import { film } from 'src/app/_type/film.type';
import { serie } from 'src/app/_type/serie.type';
import { forkJoin, map, Observable, shareReplay } from 'rxjs';

export interface NovitaInfo {
  titolo: string;
  img_titolo: string;
  sottotitolo: string;
  trailer: string;
}

// DOPO
export interface NovitaItem {
  img_sfondo: string;
  descrizione?: string;
  created_at?: string;
  novita?: boolean;
}


@Injectable({ providedIn: 'root' })
export class CaroselloNovitaService {
  // 🔹 cache della lista novità (film + serie) già filtrata e ordinata
  private novitaCache$?: Observable<NovitaItem[]>;

  // stesse ultime sei di prima, ma spostate qui
  private ordineUltimeSei: string[] = [
    'serie.cavalli_contro_circuiti',
    'film.il_mio_gatto_nella_scatola',
    'film.l_era_dell_alchimia',
    'serie.rivelazioni_dalla_sonda_cassini',
    'serie.rna_e_la_memoria_cellulare',
    'film.il_lungo_volo_del_coraggio',
  ];

  constructor(private api: ApiService) {}

  /**
   * Restituisce l'elenco delle novità:
   * - FILM + SERIE
   * - filtrati per novita && img_sfondo
   * - ordinati come prima
   * - CACHATI in memoria (shareReplay)
   */
  getNovita(forceRefresh: boolean = false): Observable<NovitaItem[]> {
    if (!this.novitaCache$ || forceRefresh) {
      const elencoFilm$ = this.api
        .getElencoFilm()
        .pipe(map((risp: IRispostaServer) => risp.data as film[]));

      const elencoSerie$ = this.api
        .getElencoSerie()
        .pipe(map((risp: IRispostaServer) => risp.data as serie[]));

      this.novitaCache$ = forkJoin([elencoFilm$, elencoSerie$]).pipe(
        map(([filmList, serieList]) => {
          const filmNovita = filmList.filter(
            (f) => f.novita && f.img_sfondo
          );
          const serieNovita = serieList.filter(
            (s) => s.novita && s.img_sfondo
          );

          // DOPO
const elenco: NovitaItem[] = [...filmNovita, ...serieNovita] as NovitaItem[];


          return this.ordinaNovita(elenco);
        }),
        // 🔹 Caching in memoria: la prossima subscribe riceve SUBITO l'ultimo valore
        shareReplay(1)
      );
    }

    return this.novitaCache$;
  }

  /**
   * Stessa logica di ordinaNovita che avevi nel componente.
   */
  private ordinaNovita(elenco: NovitaItem[]): NovitaItem[] {
    const mappaUltimeSei = new Map<string, number>(
      this.ordineUltimeSei.map((descrizione, indice) => [descrizione, indice])
    );

    const altri: NovitaItem[] = [];
    const ultimeSei: NovitaItem[] = [];

    for (const item of elenco) {
      if (item.descrizione && mappaUltimeSei.has(item.descrizione)) {
        ultimeSei.push(item);
      } else {
        altri.push(item);
      }
    }

    // 1) gli ALTRI: ordinati per created_at DESC
    altri.sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
const tb = new Date(b.created_at ?? 0).getTime();

      return tb - ta;
    });

    // 2) le ULTIME SEI: nell'ordine fisso
    ultimeSei.sort((a, b) => {
      const pa = a.descrizione ? mappaUltimeSei.get(a.descrizione) ?? 0 : 0;
      const pb = b.descrizione ? mappaUltimeSei.get(b.descrizione) ?? 0 : 0;
      return pa - pb;
    });

    return [...altri, ...ultimeSei];
  }

// DOPO (cache per lingua)
private infoNovitaCachePerLingua: Record<string, Observable<Record<string, NovitaInfo>>> = {};

getInfoNovitaMap(lang: string, forceRefresh: boolean = false): Observable<Record<string, NovitaInfo>> {
  if (!this.infoNovitaCachePerLingua[lang] || forceRefresh) {
    this.infoNovitaCachePerLingua[lang] = this.api.getVnovita().pipe(
      map((risp: IRispostaServer) => {
        const elenco = risp.data as {
  descrizione: string;
  titolo: string;
  img_titolo: string;
  sottotitolo: string;
  trailer: string;
  lingua: string;
}[];


        const mappa: Record<string, NovitaInfo> = {};

        for (const item of elenco) {
  if (item.lingua !== lang) continue;
  if (!item.descrizione) continue;

  if (!mappa[item.descrizione]) {
    mappa[item.descrizione] = {
      titolo: item.titolo || '',
      img_titolo: item.img_titolo || '',
      sottotitolo: item.sottotitolo || '',
      trailer: item.trailer || '',
    };
  }
}


        return mappa;
      }),
      shareReplay(1)
    );
  }

  return this.infoNovitaCachePerLingua[lang];
}

}

import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ElementRef,
  QueryList,
  ViewChildren,
  ViewChild,
  HostListener,
} from '@angular/core';
import { forkJoin, Subscription, take, skip, distinctUntilChanged } from 'rxjs';
import { ApiService } from 'src/app/_servizi_globali/api.service';
import { CambioLinguaService } from 'src/app/_servizi_globali/cambio-lingua.service';
import {
  TipoContenuto,
  TipoContenutoService,
} from '../app-riga-categoria/categoria_services/tipo-contenuto.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AnimazioniScomparsaService } from 'src/app/_catalogo/app-riga-categoria/categoria_services/animazioni-scomparsa.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss'],
})
export class CatalogoComponent implements OnInit, AfterViewInit, OnDestroy {
  tickAggiornamentoRighe = 0;
  tickResetPagine = 0;
  scrollYPrimaCambio = 0;
  hoFinitoTutto = false;
  idCicloRighe = 0;
  limiteRighe = 4;
  offsetRighe = 0;
  haAltreRighe = true;
  caricamentoRighe = false;
  timerSentinella: any = 0;
  timerCambioTipo: any = 0;
  cinqueElementi = Array(5).fill(0);
  @ViewChild('sentinella', { read: ElementRef })
  sentinella!: ElementRef;

  osservatoreSentinella: IntersectionObserver | null = null;
  sentinellaPronta = false;
  utenteHaScrollato = false;

  constructor(
    public api: ApiService,
    public tipoContenuto: TipoContenutoService,
    public router: Router,
    public location: Location,
    public cambioLingua: CambioLinguaService,
    public servizioAnimazioni: AnimazioniScomparsaService,
  ) {}

  sottoscrizioni = new Subscription();

  categorieDb: any[] = [];
  categorieTraduzioniDb: any[] = [];
  categorieLocandineDb: any[] = [];
  locandinaDemo = 'assets/locandine_it/locandina_it_abbraccia_il_vento.webp';

  locandineDemo: string[] = [
    this.locandinaDemo,
    this.locandinaDemo,
    this.locandinaDemo,
    this.locandinaDemo,
    this.locandinaDemo,
    this.locandinaDemo,
    this.locandinaDemo,
    this.locandinaDemo,
  ];

  righeDemo: {
    idCategoria: string;
    category: string;
    locandine: { src: string; sottotitolo: string }[];
  }[] = [];
  tipoSelezionato: TipoContenuto = 'film_serie';

  @ViewChildren('rigaCatalogo', { read: ElementRef })
  righeCatalogo!: QueryList<ElementRef>;

  ngAfterViewInit(): void {
    this.servizioAnimazioni.inizializzaAnimazioni(this.righeCatalogo);
    this.righeCatalogo.changes.subscribe(() => {
      this.servizioAnimazioni.inizializzaAnimazioni(this.righeCatalogo);
    });
    this.inizializzaOsservatoreSentinella();
  }

  @HostListener('wheel', ['$event'])
  gestisciRotellina(evento: WheelEvent): void {
    this.utenteHaScrollato = true;
    this.servizioAnimazioni.gestisciWheel(evento);
  }

  ngOnInit(): void {
    this.tipoSelezionato = this.tipoContenuto.leggiTipo();
    this.forzaRottaCatalogoDaTipo();
    this.caricaPrimeQuattroRigheDaApi(0, false);

    this.sottoscrizioni.add(
      this.cambioLingua.cambioLinguaApplicata$.subscribe(() => {
        this.tickResetPagine += 1;
        this.caricaPrimeQuattroRigheDaApi(0, false);
      }),
    );
    this.sottoscrizioni.add(
      this.tipoContenuto.tipoSelezionato$
        .pipe(
          distinctUntilChanged(),
          skip(1), // ignoro l'emissione iniziale (quella che ho gia' gestito sopra)
        )
        .subscribe((tipo) => {
          this.tipoSelezionato = tipo;
          this.tickResetPagine += 1;
          this.avviaCambioTipoConAttese();
          this.forzaRottaCatalogoDaTipo();
        }),
    );
  }

  ngOnDestroy(): void {
    this.sottoscrizioni.unsubscribe();
    try {
      this.servizioAnimazioni.disconnettiOsservatori();
    } catch {}
    if (this.timerCambioTipo) {
      clearTimeout(this.timerCambioTipo);
      this.timerCambioTipo = 0;
    }

    try {
      this.osservatoreSentinella?.disconnect();
    } catch {}
    this.osservatoreSentinella = null;
    if (this.timerSentinella) {
      clearTimeout(this.timerSentinella);
      this.timerSentinella = 0;
    }
  }

  ricostruisciRighe(
    idForzato: number = 0,
    notificaTipoApplicato: boolean = false,
  ): void {
    const id = idForzato ? idForzato : ++this.idCicloRighe;
    const codiceLingua = this.cambioLingua.leggiCodiceLingua(); // 'it' | 'en'
    const mappaNome = this.costruisciMappaNomeCategorie(codiceLingua);
    const mappaLocandine = this.costruisciMappaLocandineCategorie(
      codiceLingua,
      this.tipoSelezionato,
    );

    const categorieFiltrate = this.filtraCategoriePerTipo(
      this.categorieDb || [],
      mappaLocandine,
      this.tipoSelezionato,
    );

    const nuoveRighe = categorieFiltrate.map((cat: any) => {
      const idCategoria = cat?.id_categoria;
      const codice = String(cat?.codice || '');
      const nome = mappaNome[idCategoria] || codice;
      const locandine = mappaLocandine[String(idCategoria)] || [];
      const demo = this.locandineDemo.map((src: string) => ({
        src,
        sottotitolo: '',
      }));
      return {
        idCategoria: String(idCategoria),
        category: nome,
        locandine: locandine.length ? locandine : demo,
      };
    });

    this.precaricaImmaginiRighe(nuoveRighe).then(() => {
      if (id !== this.idCicloRighe) return;
      this.aggiornaRigheInPlace(nuoveRighe);
      this.tickAggiornamentoRighe += 1;
      if (notificaTipoApplicato) {
        this.tipoContenuto.notificaCambioTipoApplicato(
          this.tipoSelezionato,
          id,
        );
      }
    });
  }

  costruisciMappaNomeCategorie(codiceLingua: string): Record<string, string> {
    const mappa: Record<string, string> = {};
    const idLingua = this.idLinguaDaCodice(codiceLingua);

    for (const tr of this.categorieTraduzioniDb || []) {
      if (String(tr?.id_lingua) !== String(idLingua)) continue;
      const idCategoria = String(tr?.id_categoria || '');
      const nome = String(tr?.nome || '');
      if (idCategoria && nome) mappa[idCategoria] = nome;
    }
    return mappa;
  }

  idLinguaDaCodice(codiceLingua: string): number {
    return codiceLingua === 'it' ? 1 : 2;
  }

  costruisciMappaLocandineCategorie(
    codiceLingua: string,
    tipo: TipoContenuto,
  ): Record<string, { src: string; sottotitolo: string }[]> {
    const raccolta: Record<
      string,
      Array<{
        slug: string;
        tipo: string;
        idContenuto: string;
        sottotitolo: string;
      }>
    > = {};

    for (const r of this.categorieLocandineDb || []) {
      if (String(r?.lingua) !== String(codiceLingua)) continue;
      if (tipo !== 'film_serie' && String(r?.tipo) !== String(tipo)) continue;

      const idCategoria = String(r?.id_categoria || '');
      const slug = String(r?.slug || '');
      const tipoRiga = String(r?.tipo || '');
      const idContenuto = String(r?.id_contenuto || '');
      const sottotitolo = String(r?.sottotitolo || '');

      if (!idCategoria || !slug) continue;

      if (!raccolta[idCategoria]) raccolta[idCategoria] = [];
      raccolta[idCategoria].push({
        slug,
        tipo: tipoRiga,
        idContenuto,
        sottotitolo,
      });
    }

    const mappa: Record<string, { src: string; sottotitolo: string }[]> = {};
    for (const idCategoria of Object.keys(raccolta)) {
      const lista = raccolta[idCategoria];

      if (tipo === 'film_serie') {
        lista.sort((a, b) => {
          const ka = this.chiaveShuffleDeterministica(
            idCategoria,
            a.tipo,
            a.idContenuto,
          );
          const kb = this.chiaveShuffleDeterministica(
            idCategoria,
            b.tipo,
            b.idContenuto,
          );
          return ka - kb;
        });
      }

      mappa[idCategoria] = lista.map((x) => ({
        src: this.costruisciUrlLocandina(codiceLingua, x.slug),
        sottotitolo: x.sottotitolo || '',
      }));
    }

    return mappa;
  }

  tracciaRigaCategoria(_indice: number, riga: { idCategoria: string }): string {
    return riga.idCategoria;
  }

  filtraCategoriePerTipo(
    categorie: any[],
    mappaLocandine: Record<string, { src: string; sottotitolo: string }[]>,
    tipo: TipoContenuto,
  ): any[] {
    if (tipo === 'film_serie') return categorie;
    // tengo solo le categorie che hanno almeno una locandina per quel tipo
    return categorie.filter((cat: any) => {
      const idCategoria = String(cat?.id_categoria || '');
      return !!(
        idCategoria &&
        mappaLocandine[idCategoria] &&
        mappaLocandine[idCategoria].length
      );
    });
  }

  calcolaHash32(testo: string): number {
    // FNV-1a 32-bit (deterministico)
    let h = 2166136261;
    for (let i = 0; i < testo.length; i++) {
      h ^= testo.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  chiaveShuffleDeterministica(
    idCategoria: string,
    tipo: string,
    idContenuto: string,
  ): number {
    return this.calcolaHash32(idCategoria + '|' + tipo + '|' + idContenuto);
  }

  forzaRottaCatalogoDaTipo(): void {
    const url = this.router.url || '';
    const base = url.split('?')[0].split('#')[0];
    const eCatalogoNudo = base === '/catalogo' || base === '/catalogo/';
    if (!eCatalogoNudo) return;

    const target = this.pathCatalogoDaTipo(this.tipoSelezionato);
    if (target !== base) this.location.go(target);
  }

  pathCatalogoDaTipo(val: TipoContenuto): string {
    if (val === 'film') return '/catalogo/film';
    if (val === 'serie') return '/catalogo/serie';
    return '/catalogo/film-serie';
  }

  costruisciUrlLocandina(codiceLingua: string, slug: string): string {
    return `assets/locandine_${codiceLingua}/locandina_${codiceLingua}_${slug}.webp`;
  }

  avviaCambioTipoConAttese(): void {
    if (this.timerCambioTipo) {
      clearTimeout(this.timerCambioTipo);
      this.timerCambioTipo = 0;
    }

    this.idCicloRighe += 1;
    const id = this.idCicloRighe;

    this.tipoContenuto.notificaCambioTipoAvviato(this.tipoSelezionato, id);

    // stesso delay del vecchio (100ms)
    this.timerCambioTipo = setTimeout(() => {
      this.timerCambioTipo = 0;
      this.caricaPrimeQuattroRigheDaApi(id, true);
    }, 100);
  }
  precaricaImmaginiRighe(
    righe: { locandine: { src: string; sottotitolo: string }[] }[],
  ): Promise<void> {
    const urls: string[] = [];
    for (const r of righe || []) {
      for (const p of r.locandine || []) {
        const u = String(p?.src || '');
        if (u) urls.push(u);
      }
    }
    if (!urls.length) return Promise.resolve();

    const promesse = urls.map(
      (u) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          (img as any).decode
            ? (img as any)
                .decode()
                .then(() => resolve())
                .catch(() => resolve())
            : (img.src = u);
          img.src = u;
        }),
    );
    return Promise.all(promesse).then(() => {});
  }

  aggiornaRigheInPlace(
    nuoveRighe: {
      idCategoria: string;
      category: string;
      locandine: { src: string; sottotitolo: string }[];
    }[],
  ): void {
    const mappaEsistenti: Record<string, any> = {};
    for (const r of this.righeDemo || [])
      mappaEsistenti[String(r.idCategoria)] = r;

    const ordine: any[] = [];
    for (const n of nuoveRighe) {
      const idCat = String(n.idCategoria);
      const r = mappaEsistenti[idCat] || {
        idCategoria: idCat,
        category: '',
        locandine: [],
      };
      r.category = n.category;
      this.aggiornaLocandineInPlace(r.locandine, n.locandine);
      ordine.push(r);
    }

    // IMPORTANT: tengo lo stesso array reference
    this.righeDemo.splice(0, this.righeDemo.length, ...ordine);
  }

  aggiornaLocandineInPlace(
    target: { src: string; sottotitolo: string }[],
    sorgente: { src: string; sottotitolo: string }[],
  ): void {
    const t = target || [];
    const s = sorgente || [];

    while (t.length < s.length) t.push({ src: '', sottotitolo: '' });
    if (t.length > s.length) t.splice(s.length);

    for (let i = 0; i < s.length; i++) {
      t[i].src = s[i].src;
      t[i].sottotitolo = s[i].sottotitolo || '';
    }
  }

  caricaPrimeQuattroRigheDaApi(
    idForzato: number = 0,
    notificaTipoApplicato: boolean = false,
  ): void {
    const id = idForzato ? idForzato : ++this.idCicloRighe;
    const lingua = this.cambioLingua.leggiCodiceLingua(); // 'it' | 'en'
    const tipo = this.tipoSelezionato; // 'film' | 'serie' | 'film_serie'
    this.scrollYPrimaCambio = window.scrollY || 0;
    if (this.timerSentinella) {
      clearTimeout(this.timerSentinella);
      this.timerSentinella = 0;
    }
    const eroFinitoPrimaDelCambio = this.hoFinitoTutto;
    const totaleDaRicaricare =
      this.offsetRighe > 0 ? this.offsetRighe : this.limiteRighe;
    this.caricamentoRighe = true;
  this.sentinellaPronta = false;
  this.utenteHaScrollato = false;

    const richieste: any[] = [];
    for (let off = 0; off < totaleDaRicaricare; off += this.limiteRighe) {
      const lim = Math.min(this.limiteRighe, totaleDaRicaricare - off);
      richieste.push(
        this.api.getCatalogoRighe(lingua, tipo, lim, off).pipe(take(1)),
      );
    }

    forkJoin(richieste).subscribe((risposte: any[]) => {
      const itemsTotali: any[] = [];
      for (const ris of risposte || []) {
        const items = Array.isArray(ris?.data?.items) ? ris.data.items : [];
        itemsTotali.push(...items);
      }

      const nuoveRighe = itemsTotali
        .map((x: any) => ({
          idCategoria: String(x?.idCategoria || ''),
          category: String(x?.category || ''),
          locandine: Array.isArray(x?.locandine) ? x.locandine : [],
        }))
        .filter((x: any) => !!x.idCategoria);

      this.precaricaImmaginiRighe(nuoveRighe).then(() => {
        if (id !== this.idCicloRighe) return;

        // sostituzione "atomica": niente svuota-ricarica, zero salti
        this.righeDemo.splice(0, this.righeDemo.length, ...nuoveRighe);

        this.offsetRighe = nuoveRighe.length;

        const ultimo =
          risposte && risposte.length ? risposte[risposte.length - 1] : null;
        const itemsUltimo = Array.isArray(ultimo?.data?.items)
          ? ultimo.data.items
          : [];
        const limUltimo = Math.min(
          this.limiteRighe,
          totaleDaRicaricare -
            Math.max(0, (risposte.length - 1) * this.limiteRighe),
        );
        this.haAltreRighe = itemsUltimo.length === limUltimo;
        this.hoFinitoTutto = !this.haAltreRighe;

        this.caricamentoRighe = false;
        this.tickAggiornamentoRighe += 1;

        if (!this.haAltreRighe) {
          try {
            this.osservatoreSentinella?.disconnect();
          } catch {}
          this.osservatoreSentinella = null;
        }

        requestAnimationFrame(() => {
            window.scrollTo(0, this.scrollYPrimaCambio);
          if (eroFinitoPrimaDelCambio) this.hoFinitoTutto = true;
        this.sentinellaPronta = this.haAltreRighe && !this.hoFinitoTutto;
        if (this.sentinellaPronta) this.inizializzaOsservatoreSentinella();
        });

        if (notificaTipoApplicato) {
          this.tipoContenuto.notificaCambioTipoApplicato(
            this.tipoSelezionato,
            id,
          );
        }
      });
    });
  }

  inizializzaOsservatoreSentinella(): void {
    try {
      this.osservatoreSentinella?.disconnect();
    } catch {}
    this.osservatoreSentinella = null;

    const host = this.sentinella?.nativeElement;
    if (!host) return;

    this.osservatoreSentinella = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!this.sentinellaPronta) continue;
          if (!this.utenteHaScrollato) continue;
          if (!this.haAltreRighe) return;
          if (this.caricamentoRighe) return;

          if (this.timerSentinella) clearTimeout(this.timerSentinella);
          this.timerSentinella = setTimeout(() => {
            this.timerSentinella = 0;
            this.caricaAltreQuattroRigheDaApi();
          }, 20);
        }
      },
      {
        root: null,
        threshold: 0.1,
      },
    );

    this.osservatoreSentinella.observe(host);
  }

  caricaAltreQuattroRigheDaApi(): void {
    if (!this.haAltreRighe) return;
    if (this.caricamentoRighe) return;

    this.caricamentoRighe = true;

    const id = ++this.idCicloRighe;
    const lingua = this.cambioLingua.leggiCodiceLingua();
    const tipo = this.tipoSelezionato;
    const offset = this.offsetRighe;

    this.api
      .getCatalogoRighe(lingua, tipo, this.limiteRighe, offset)
      .pipe(take(1))
      .subscribe((ris: any) => {
        const items = Array.isArray(ris?.data?.items) ? ris.data.items : [];

        const nuoveRighe = items
          .map((x: any) => ({
            idCategoria: String(x?.idCategoria || ''),
            category: String(x?.category || ''),
            locandine: Array.isArray(x?.locandine) ? x.locandine : [],
          }))
          .filter((x: any) => !!x.idCategoria);

        this.precaricaImmaginiRighe(nuoveRighe).then(() => {
          if (id !== this.idCicloRighe) return;

          // evita duplicati (se per qualsiasi motivo il server ripete)
          const gia: Record<string, boolean> = {};
          for (const r of this.righeDemo) gia[String(r.idCategoria)] = true;

          const soloNuove = nuoveRighe.filter(
            (r: {
              idCategoria: string;
              category: string;
              locandine: { src: string; sottotitolo: string }[];
            }) => !gia[String(r.idCategoria)],
          );

            if (soloNuove.length > 0) this.hoFinitoTutto = false;
  this.righeDemo.push(...soloNuove);
          this.offsetRighe += nuoveRighe.length;

          // se il server ha restituito meno di 4 -> finito
          this.haAltreRighe = nuoveRighe.length === this.limiteRighe;
          if (!this.haAltreRighe) this.hoFinitoTutto = true;
          this.caricamentoRighe = false;
          this.tickAggiornamentoRighe += 1;
          if (!this.haAltreRighe) {
            try {
              this.osservatoreSentinella?.disconnect();
            } catch {}
            this.osservatoreSentinella = null;
          }
        });
      });
  }
}

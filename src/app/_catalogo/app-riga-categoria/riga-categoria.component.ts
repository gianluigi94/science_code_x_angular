import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CambioLinguaService } from 'src/app/_servizi_globali/cambio-lingua.service';
import { Subscription } from 'rxjs';
import { HoverLocandinaService } from './categoria_services/hover-locandina.service';
import { TipoContenutoService } from './categoria_services/tipo-contenuto.service';
@Component({
  selector: 'app-riga-categoria',
  templateUrl: './riga-categoria.component.html',
  styleUrls: ['./riga-categoria.component.scss'],
})
export class RigaCategoriaComponent implements OnChanges, OnInit, OnDestroy {
  @Input() locandine: { src: string; sottotitolo: string }[] = [];
  @Input() categoria = '';
   @Input() tickAggiornamento = 0;
 @Input() tickResetPagine = 0;

   @ViewChildren('elementoLocandina', { read: ElementRef })
 elementiLocandina!: QueryList<ElementRef>;
  locandineVisibili = 5;
  indicePagina = 0;
  numeroMassimoPagine = 0;
  trasformazioneWrapper = '';
    mostraSpinner = false;
  inAttesaImmagini = false;
  totaleAtteso = 0;
  conteggioCaricate = 0;
  idCiclo = 0;
   cicloTrackBy = 0;
 motivoCopertura = ''; // 'lingua' | 'tipo' | ''
  timerFallback: any = 0;
  timerNascondi: any = 0;
  timerMinimo: any = 0;
  avvioSpinnerAt = 0;
  permanenzaMinimaMs = 350;
  fallbackMaxMs = 2000;
  sottoscrizioni = new Subscription();
  ritardoUscitaHoverMs = 160;
  ritardoHoverMs = 380;
  timerEntrata: any = null;
  hoverConfermato = false;
  slugHoverInAttesa = '';
    constructor(
    public servizioHoverLocandina: HoverLocandinaService,
    public cambioLingua: CambioLinguaService,
    public tipoContenuto: TipoContenutoService,
    public riferitore: ChangeDetectorRef
  ) {}

  ngOnChanges(_changes: SimpleChanges): void {
       if (_changes['tickResetPagine']) {
     this.indicePagina = 0;
   }

   if (_changes['tickAggiornamento'] || _changes['locandine']) {
     this.calcolaNumeroMassimoPagine();
     if (this.indicePagina > this.numeroMassimoPagine) this.indicePagina = 0;
     this.aggiornaTrasformazioneWrapper();
   }
       if (this.mostraSpinner && this.motivoCopertura === 'tipo') {
      this.assicuraCoperturaCompleta(this.idCiclo, 0);
       }
  }

    ngOnInit(): void {
    try { this.sottoscrizioni.unsubscribe(); } catch {}
    this.sottoscrizioni = new Subscription();

    this.sottoscrizioni.add(
      this.cambioLingua.cambioLinguaAvviato$.subscribe(() => {
        this.avviaCopertura(0, 'lingua');
      })
    );

    this.sottoscrizioni.add(
      this.cambioLingua.cambioLinguaApplicata$.subscribe(() => {
        const id = this.idCiclo;
        this.inAttesaImmagini = true;
        this.totaleAtteso = (this.locandine || []).length;
        this.conteggioCaricate = 0;
        this.timerFallback = setTimeout(() => this.fineSePronto(true, id), this.fallbackMaxMs);
      })
    );
        this.sottoscrizioni.add(
      this.tipoContenuto.cambioTipoAvviato$.subscribe(({ id }) => {
        this.avviaCopertura(id, 'tipo');
      })
    );

    this.sottoscrizioni.add(
      this.tipoContenuto.cambioTipoApplicato$.subscribe(({ id }) => {
        this.fineCoperturaDopoMinimo(id);
      })
    );
  }

    avviaCopertura(idForzato: number = 0, motivo: string = ''): void {
    this.idCiclo = idForzato ? idForzato : (this.idCiclo + 1);
        this.motivoCopertura = motivo;
    if (motivo === 'tipo') this.cicloTrackBy += 1;
    this.azzeraTimer();
    this.inAttesaImmagini = false;
    this.mostraSpinner = true;
    this.avvioSpinnerAt = Date.now();
    try { this.riferitore.detectChanges(); } catch {}
    requestAnimationFrame(() => {
      try { this.riferitore.detectChanges(); } catch {}
      if (motivo === 'tipo') this.assicuraCoperturaCompleta(this.idCiclo, 0);
    });
  }
  assicuraCoperturaCompleta(id: number, tentativi: number): void {
    if (id !== this.idCiclo) return;
    if (!this.mostraSpinner) return;

    const lista = this.elementiLocandina ? this.elementiLocandina.toArray() : [];
    if (!lista.length) {
      if (tentativi >= 10) return;
      requestAnimationFrame(() => this.assicuraCoperturaCompleta(id, tentativi + 1));
      return;
    }

    let ok = true;
    for (const ref of lista) {
      const host = ref?.nativeElement;
      const cover = host ? host.querySelector('.carica_img') : null;
      if (!cover || !cover.classList || !cover.classList.contains('visibile')) {
        ok = false;
        break;
      }
    }

    if (ok) return;
    if (tentativi >= 10) return;

    try { this.riferitore.detectChanges(); } catch {}
    requestAnimationFrame(() => this.assicuraCoperturaCompleta(id, tentativi + 1));
  }
  fineCoperturaDopoMinimo(id: number): void {
    if (id !== this.idCiclo) return;
    if (this.timerNascondi) clearTimeout(this.timerNascondi);

        const manca = (this.motivoCopertura === 'tipo') ? 100 : (() => {
      const elapsed = Date.now() - (this.avvioSpinnerAt || 0);
      return Math.max(0, this.permanenzaMinimaMs - elapsed);
    })();

    this.timerNascondi = setTimeout(() => {
      if (id !== this.idCiclo) return;
      this.mostraSpinner = false;
      this.motivoCopertura = '';
      try { this.riferitore.detectChanges(); } catch {}
    }, manca);
  }
  ngOnDestroy(): void {
    this.sottoscrizioni.unsubscribe();
    this.azzeraTimer();
  }

  immagineStabilizzata(): void {
    if (!this.inAttesaImmagini) return;
    this.conteggioCaricate++;
    this.fineSePronto(false, this.idCiclo);
  }

  fineSePronto(forzatura: boolean, id: number): void {
    if (id !== this.idCiclo) return;
    if (forzatura || this.conteggioCaricate >= this.totaleAtteso) {
      this.inAttesaImmagini = false;
      if (this.timerNascondi) clearTimeout(this.timerNascondi);

      const elapsed = Date.now() - (this.avvioSpinnerAt || 0);
      const manca = Math.max(0, this.permanenzaMinimaMs - elapsed);

      this.timerNascondi = setTimeout(() => {
        if (id !== this.idCiclo) return;
        this.mostraSpinner = false;
        try { this.riferitore.detectChanges(); } catch {}
      }, manca);
    }
  }

  azzeraTimer(): void {
    if (this.timerFallback) { clearTimeout(this.timerFallback); this.timerFallback = 0; }
    if (this.timerNascondi) { clearTimeout(this.timerNascondi); this.timerNascondi = 0; }
    if (this.timerMinimo) { clearTimeout(this.timerMinimo); this.timerMinimo = 0; }
  }

  calcolaNumeroMassimoPagine(): void {
    const totale = this.locandine.length;
    this.numeroMassimoPagine = Math.max(
      Math.ceil(totale / this.locandineVisibili) - 1,
      0,
    );
  }

  aggiornaTrasformazioneWrapper(): void {
    this.trasformazioneWrapper = `translateX(${-this.indicePagina * 100}%)`;
  }

  paginaSuccessiva(): void {
    if (this.indicePagina < this.numeroMassimoPagine) {
      this.indicePagina++;
      this.aggiornaTrasformazioneWrapper();
    }
  }

  paginaPrecedente(): void {
    if (this.indicePagina > 0) {
      this.indicePagina--;
      this.aggiornaTrasformazioneWrapper();
    }
  }

  onMouseEnterLocandina(p: { src: string; sottotitolo: string }): void {
    if (this.timerEntrata) clearTimeout(this.timerEntrata);
    this.servizioHoverLocandina.annullaUscita();
    this.slugHoverInAttesa = this.slugDaSrc(p.src);
    this.timerEntrata = setTimeout(() => {
      this.hoverConfermato = true;
      this.servizioHoverLocandina.emettiEntrata(
        this.slugHoverInAttesa,
        p.sottotitolo || '',
      );
    }, this.ritardoHoverMs);
  }

  onMouseLeaveLocandina(): void {
    if (this.timerEntrata) clearTimeout(this.timerEntrata);
    if (!this.hoverConfermato) {
      // non ho confermato il nuovo hover: se sto davvero uscendo da tutte, chiudo dopo il delay
      this.servizioHoverLocandina.pianificaUscita(this.ritardoUscitaHoverMs);
      return;
    }

    this.hoverConfermato = false;
    this.servizioHoverLocandina.pianificaUscita(this.ritardoUscitaHoverMs);
  }

  private slugDaSrc(src: string): string {
    const nome =
      String(src || '')
        .split('/')
        .pop() || '';
    return nome
      .replace(/^carosello_/, '')
      .replace(/^locandina_it_/, '')
      .replace(/^locandina_en_/, '')
      .replace(/\.webp$/i, '');
  }

      tracciaLocandina(indice: number, p: { src: string; sottotitolo: string }): string {
    const base = String(p?.src || '');
    // durante cambio TIPO: niente riuso nodi (evita "buchi" nella copertura)
    if (this.mostraSpinner && this.motivoCopertura === 'tipo') {
      return this.cicloTrackBy + '|' + indice + '|' + base;
    }
    // normale: stabile
    return base;
  }
}

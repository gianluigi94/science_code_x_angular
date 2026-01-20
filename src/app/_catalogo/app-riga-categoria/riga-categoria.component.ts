import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HoverLocandinaService } from './categoria_services/hover-locandina.service';
import { AudioGlobaleService } from 'src/app/_servizi_globali/audio-globale.service';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-riga-categoria',
  templateUrl: './riga-categoria.component.html',
  styleUrls: ['./riga-categoria.component.scss'],
})
export class RigaCategoriaComponent implements OnChanges {
  @Input() locandine: { src: string; sottotitolo: string }[] = [];
  @Input() categoria = '';

  locandineVisibili = 5;
  indicePagina = 0;
  numeroMassimoPagine = 0;
  trasformazioneWrapper = '';
    audioAttivo$!: Observable<boolean>;
  browserBlocca$!: Observable<boolean>;
ritardoUscitaHoverMs = 160;
     ritardoHoverMs = 380;
  timerEntrata: any = null;
  hoverConfermato = false;
  slugHoverInAttesa = '';
     constructor(
    public servizioHoverLocandina: HoverLocandinaService,
    public audioGlobale: AudioGlobaleService
  ) {
    this.audioAttivo$ = this.audioGlobale.leggiAudioAttivo$();
    this.browserBlocca$ = this.audioGlobale.leggiBrowserBlocca$();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.calcolaNumeroMassimoPagine();
    if (this.indicePagina > this.numeroMassimoPagine) this.indicePagina = 0;
    this.aggiornaTrasformazioneWrapper();
  }

  calcolaNumeroMassimoPagine(): void {
    const totale = this.locandine.length;
    this.numeroMassimoPagine = Math.max(Math.ceil(totale / this.locandineVisibili) - 1, 0);
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
       this.servizioHoverLocandina.emettiEntrata(this.slugHoverInAttesa, p.sottotitolo || '');
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
    const nome = String(src || '').split('/').pop() || '';
        return nome
      .replace(/^carosello_/, '')
      .replace(/^locandina_it_/, '')
      .replace(/^locandina_en_/, '')
      .replace(/\.webp$/i, '');
  }
}

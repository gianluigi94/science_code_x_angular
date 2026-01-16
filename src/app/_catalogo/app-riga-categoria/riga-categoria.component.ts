import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HoverLocandinaService } from './categoria_services/hover-locandina.service';
@Component({
  selector: 'app-riga-categoria',
  templateUrl: './riga-categoria.component.html',
  styleUrls: ['./riga-categoria.component.scss'],
})
export class RigaCategoriaComponent implements OnChanges {
  @Input() locandine: string[] = [];
  @Input() categoria = '';

  locandineVisibili = 5;
  indicePagina = 0;
  numeroMassimoPagine = 0;
  trasformazioneWrapper = '';

ritardoUscitaHoverMs = 160;
     ritardoHoverMs = 380;
  timerEntrata: any = null;
  timerUscita: any = null;
  hoverConfermato = false;
  slugHoverInAttesa = '';
   constructor(public servizioHoverLocandina: HoverLocandinaService) {}

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


   onMouseEnterLocandina(src: string): void {
     if (this.timerEntrata) clearTimeout(this.timerEntrata);
     if (this.timerUscita) clearTimeout(this.timerUscita);
this.slugHoverInAttesa = this.slugDaSrc(src);
     this.timerEntrata = setTimeout(() => {
      this.hoverConfermato = true;
       this.servizioHoverLocandina.emettiEntrata(this.slugHoverInAttesa);
     }, this.ritardoHoverMs);
   }

   onMouseLeaveLocandina(): void {
     if (this.timerEntrata) clearTimeout(this.timerEntrata);
             if (this.timerUscita) clearTimeout(this.timerUscita);

    this.timerUscita = setTimeout(() => {
      if (!this.hoverConfermato) return;
      this.hoverConfermato = false;
      this.servizioHoverLocandina.emettiUscita();
    }, this.ritardoUscitaHoverMs);
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

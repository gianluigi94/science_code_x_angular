import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AudioGlobaleService } from './../../_servizi_globali/audio-globale.service';

@Component({
  selector: 'app-bottone-audio',
  templateUrl: './bottone-audio.component.html',
  styleUrls: ['./bottone-audio.component.scss'],
})
export class BottoneAudioComponent implements OnInit, OnDestroy {
  // true = audio consentito (icona senza sbarra), false = audio bloccato (con sbarra)
  attivo = false;
  sottoscrizioneStato: Subscription | null = null;

  constructor(public audioGlobale: AudioGlobaleService) {}

  ngOnInit(): void {
    // sincronizza lo stato visivo con lo stato globale / localStorage
    this.sottoscrizioneStato = this.audioGlobale.statoAudio$.subscribe(val => {
      this.attivo = val;
    });
  }

  ngOnDestroy(): void {
    if (this.sottoscrizioneStato) {
      try { this.sottoscrizioneStato.unsubscribe(); } catch {}
      this.sottoscrizioneStato = null;
    }
  }

  alClic(): void {
    // cambia lo stato globale → aggiorna TUTTI i bottoni e salva su localStorage
    this.audioGlobale.toggle();
  }
}

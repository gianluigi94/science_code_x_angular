import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioGlobaleService } from 'src/app/_servizi_globali/audio-globale.service';

@Component({
  selector: 'app-bottone-audio',
  templateUrl: './bottone-audio.component.html',
  styleUrls: ['./bottone-audio.component.scss'],
})
export class BottoneAudioComponent implements OnDestroy {
  audioAttivo = true; // default senza sbarra
  distruggi$ = new Subject<void>();

  constructor(private audioGlobale: AudioGlobaleService) {
    this.audioGlobale
      .leggiAudioAttivo$()
      .pipe(takeUntil(this.distruggi$))
      .subscribe((attivo) => {
        this.audioAttivo = attivo;
      });
  }

  onToggleAudio() {
    this.audioGlobale.toggleAudio();
  }

  ngOnDestroy(): void {
    this.distruggi$.next();
    this.distruggi$.complete();
  }
}

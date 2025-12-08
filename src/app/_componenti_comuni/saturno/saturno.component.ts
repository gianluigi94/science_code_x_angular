import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { SaturnoService } from '../../_servizi_globali/animazioni_saturno/three/saturno.service';
import { ScrollWelcomeService } from '../../_servizi_globali/animazioni_saturno/gsap/scroll-welcome.service';

@Component({
  selector: 'app-saturno',
  templateUrl: './saturno.component.html',
  styleUrls: ['./saturno.component.scss'],
})
export class SaturnoComponent implements OnInit, OnDestroy {
  @Output() saturnLoadDone = new EventEmitter<void>();

  @Input() usaAnimazioniIngresso: boolean = true;
  @Input() usaAnimazioniScroll: boolean = true;

  saturnoService: SaturnoService;
  scrollWelcomeService: ScrollWelcomeService;

  constructor(
    saturnoService: SaturnoService,
    scrollWelcomeService: ScrollWelcomeService
  ) {
    this.saturnoService = saturnoService;
    this.scrollWelcomeService = scrollWelcomeService;
  }

ngOnInit(): void {
  this.saturnoService.initializeSaturn(this.usaAnimazioniIngresso).then(() => {
    this.saturnLoadDone.emit();

    const scene = this.saturnoService.getScene();
    const camera = this.saturnoService.getCamera();
    const light = this.saturnoService.getDirectionalLight();

    if (scene && camera && light && this.usaAnimazioniScroll) {
      this.scrollWelcomeService.runAllAnimations(scene, camera, light);
    }
  });
}


  ngOnDestroy(): void {
    // Se questo Saturno aveva animazioni di scroll, quando esco dalla pagina
    // le devo spegnere completamente (ScrollTrigger + event listener globali)
    if (this.usaAnimazioniScroll) {
      this.scrollWelcomeService.stopAllScrollAnimations();
    }

    // In ogni caso stacco il canvas e fermo il loop, ma NON distruggo la scena
    this.saturnoService.spegniSaturno();
  }
}

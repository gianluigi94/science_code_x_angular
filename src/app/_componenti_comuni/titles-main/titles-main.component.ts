import { Component, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PerformanceService } from '../../_servizi_globali/performance.service';
import { AnimateService } from '../../_servizi_globali/animazioni_saturno/animate.service';
import * as THREE from 'three';

@Component({
  selector: 'app-titles-main',
  templateUrl: './titles-main.component.html',
  styleUrls: ['./titles-main.component.scss'],
  encapsulation: ViewEncapsulation.None //permette al CSS del componente di "uscire" e influenzare anche elementi esterni (non è isolato)
})
export class TitlesMainComponent implements AfterViewInit {


  //dichiaro elementi della scena 3D che voglio animare
  private light: THREE.DirectionalLight | null = null;
  private particleGroups: THREE.Group[] = [];

  constructor(
  private elementRef: ElementRef,
  private performanceService: PerformanceService,
  private animateService: AnimateService,
  private router: Router
) {}


  public isLowPerf: boolean = false; //dichiara se il dispositivo non è dei migliori, inizia con false

  private isMobileOrTablet(): boolean {
    const userAgent = navigator.userAgent.toLowerCase(); //userAgent capisce che tipo di dispositivo sto usando otenedo una stringa e ritorna il dispositivo
    return /android|iphone|ipad|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent);
  }

// DOPO
ngAfterViewInit(): void {
  const firstElement = this.elementRef.nativeElement.querySelector('.first') as HTMLElement;

  this.performanceService.isLowEndPC$.subscribe((isLowEnd) => {
    setTimeout(() => {
      // aggiorno la flag in un nuovo tick → niente ExpressionChanged
      this.isLowPerf = isLowEnd || this.isMobileOrTablet();

      // ora il template ha già deciso se mostrare .x-low o .x-high
      const xElement = this.elementRef.nativeElement.querySelector('[data-titolo-x]') as HTMLElement;

      this.animateService.animateAll(
        firstElement,
        xElement,
        this.light,
        this.particleGroups
      );
    }, 0);
  });
}







}

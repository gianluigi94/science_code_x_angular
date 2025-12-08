import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  Observable,
  Observer,
  of,
  Subject,
  take,
  takeUntil,
} from 'rxjs';
import { Authservice } from './_login_service/auth.service';
import { Auth } from 'src/app/_type/auth.type';
import { IRispostaServer } from 'src/app/_interfacce/IRispostaServer.interface';
import { ApiService } from 'src/app/_servizi_globali/api.service';
import { UtilityService } from './_login_service/login_utility.service';
import { Router } from '@angular/router';
import { LoginAnimazioniService } from 'src/app/_servizi_globali/animazioni_saturno/gsap/login_animazioni.service';
import gsap from 'gsap';
import { SaturnoService } from 'src/app/_servizi_globali/animazioni_saturno/three/saturno.service';
import { ToastService } from 'src/app/_servizi_globali/toast.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('loginContenuto', { static: true })
  loginContenuto!: ElementRef<HTMLElement>;

  stoControllando: boolean = false;
  reactiveForm: FormGroup;
  auth: BehaviorSubject<Auth>;
  formInviato: boolean = false;
  mostraPassword: boolean = false;
  private distruggi$ = new Subject<void>();

  // flag per decidere se saltare l’animazione in uscita (es. dopo login ok)
  saltaAnimazioneUscita: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: Authservice,
    private api: ApiService,
    private router: Router,
    private loginAnimazioniService: LoginAnimazioniService,
    private toastService: ToastService,
    private saturnoService: SaturnoService,
    private translate: TranslateService
  ) {
    this.reactiveForm = this.fb.group({
      utente: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.minLength(5),
          Validators.maxLength(40),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(20),
        ],
      ],
      restaCollegato: [false],
    });

    this.auth = this.authService.leggiObsAuth();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // pannello login
    if (this.loginContenuto?.nativeElement) {
      this.loginAnimazioniService.animaIngresso(
        this.loginContenuto.nativeElement
      );
    }

    // footer che sale dal basso
    const footer = document.querySelector('footer') as HTMLElement | null;
    if (footer) {
      gsap.set(footer, {
        scaleY: 0,
        transformOrigin: 'bottom center',
        opacity: 0,
      });

      gsap.to(footer, {
        scaleY: 1,
        opacity: 1,
        duration: 0.3,
        delay: 0.6, // sincronizza con il pannello login
        ease: 'power2.out',
      });
    }

    // 🔸 testo footer-p che appare dopo il footer
    const footerP = document.querySelector('#footer-p') as HTMLElement | null;
    if (footerP) {
      gsap.set(footerP, { opacity: 0 });

      gsap.to(footerP, {
        opacity: 1,
        duration: 0.9,
        delay: 1.15, // un po' dopo il footer (puoi giocare 1.5 / 1.7)
        ease: 'power2.out',
      });
    }

    this.nascondiSottotitoloEScrol();
  }

  // chiamato dal guard
  // chiamato dal guard
  animaUscita(): Promise<void> {
    if (this.saltaAnimazioneUscita) {
      // es. dopo login corretto vogliamo andare via subito
      return Promise.resolve();
    }

    const animazioni: Promise<void>[] = [];

    // 1) pannello login (come prima, via servizio)
    if (this.loginContenuto?.nativeElement) {
      animazioni.push(
        this.loginAnimazioniService.animaUscita(
          this.loginContenuto.nativeElement
        )
      );
    }

    // 2) footer che “scende” via
    const footer = document.querySelector('footer') as HTMLElement | null;
    if (footer) {
      animazioni.push(
        new Promise<void>((resolve) => {
          gsap.to(footer, {
            scaleY: 0,
            opacity: 0,
            duration: 0.25,
            delay: 0.25,
            ease: 'power2.in',
            onComplete: resolve,
          });
        })
      );
    }

    // 3) testo footer-p che svanisce
    const footerP = document.querySelector('#footer-p') as HTMLElement | null;
    if (footerP) {
      animazioni.push(
        new Promise<void>((resolve) => {
          gsap.to(footerP, {
            opacity: 0,
            duration: 0.2,
            ease: 'power1.in',
            onComplete: resolve,
          });
        })
      );
    }

    if (animazioni.length === 0) {
      return Promise.resolve();
    }

    // aspetta che TUTTE le animazioni finiscano
    return Promise.all(animazioni).then(() => {});
  }

  accedi(): void {
    this.formInviato = true;
    if (this.reactiveForm.invalid) {
      this.reactiveForm.markAllAsTouched();
    } else {
      const utente = this.reactiveForm.controls['utente'].value;
      const password = this.reactiveForm.controls['password'].value;
      const restaCollegato =
        !!this.reactiveForm.controls['restaCollegato'].value;

      this.stoControllando = true;
      this.obsLogin(utente, password, restaCollegato).subscribe(
        this.osservoLogin()
      );
    }
  }

  private obsLogin(
    utente: string,
    password: string,
    restaCollegato: boolean
  ): Observable<IRispostaServer> {
    return this.api
      .login(utente, password, restaCollegato)
      .pipe(take(1), takeUntil(this.distruggi$));
  }

  private osservoLogin() {
    const osservatore: Observer<any> = {
      next: (rit: IRispostaServer) => {
        if (rit.data !== null && rit.message !== null) {
          const tk: string = rit.data.tk;
          const p = UtilityService.leggiToken(tk)?.data || {};
          const auth: Auth = {
            tk: tk,
            nome: p.nome ?? null,
            idRuolo: p.id_ruolo ?? null,
            idStato: p.id_stato_utente ?? null,
            idUtente: p.id_contatto ?? null,
            abilita: Array.isArray(p.abilita) ? p.abilita : null,
          };
          this.authService.settaObsAuth(auth);
          this.authService.scriviAuthSuLocalStorage(auth);

          // dopo login ok → niente animazione in uscita
          this.saltaAnimazioneUscita = true;
          this.router.navigateByUrl('/catalogo');
        } else {
          this.saturnoService.flashErrorLight();
        }
        this.stoControllando = false;
      },
      error: (err) => {

        const chiave = this.chiaveToastErroreDaBackend(err);
        const messaggio = this.translate.instant(chiave);

        if (chiave === 'ui.toast.error.login.max_acces') {
          this.toastService.allarm(messaggio);
        } else {
          this.toastService.errore(messaggio);
        }

        this.saturnoService.flashErrorLight();
        const auth: Auth = {
          tk: null,
          nome: null,
          idRuolo: null,
          idStato: null,
          idUtente: null,
          abilita: null,
        };
        this.authService.settaObsAuth(auth);
        this.stoControllando = false;
      },

      complete: () => {
        this.stoControllando = false;
      },
    };
    return osservatore;
  }

  private nascondiSottotitoloEScrol(): void {
    const subtitle = document.querySelector('.subtitle') as HTMLElement | null;
    const scrol = document.querySelector('.scrol') as HTMLElement | null;

    if (subtitle) {
      gsap.killTweensOf(subtitle);
      gsap.set(subtitle, { opacity: 0, display: 'none' });
    }

    if (scrol) {
      gsap.killTweensOf(scrol);
      gsap.set(scrol, { opacity: 0 });
    }
  }

  ngOnDestroy(): void {
    this.distruggi$.next();
  }

  private chiaveToastErroreDaBackend(err: any): string {
  console.log('ERRORE LOGIN', err); // 👈 importantissimo per capire cosa arriva

  let msg: any = '';

  if (err?.error) {
    if (typeof err.error === 'string') {
      msg = err.error;
    } else if (typeof err.error?.message === 'string') {
      msg = err.error.message;
    }
  } else if (typeof err?.message === 'string') {
    msg = err.message;
  }

  // fallback: forza a stringa per sicurezza
  if (typeof msg !== 'string') {
    msg = String(msg ?? '');
  }

  if (msg.includes('UTENTE BANNATO')) {
    return 'ui.toast.error.login.bannato';
  }

  if (msg.includes('PASSWORD (o nome utente) NON TROVATA SUL DATABASE')) {
    return 'ui.toast.error.login.mancante';
  }

  if (msg.includes('LIMITE TENTATIVI DI ACCESSO TERMINATI')) {
    return 'ui.toast.error.login.max_acces';
  }

  if (msg.includes('PASSWORD SCADUTA')) {
    return 'ui.toast.erro.login.password_deprecata';
  }

  // fallback generico
  return 'ui.toast.error.login.mancante';
}

}

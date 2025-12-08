import { Injectable } from '@angular/core';
import { sha512 } from 'js-sha512';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class UtilityService {
  static leggiToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (Error) {
      return null;
    }
  }

  static nascondiPassword(password: string, sale: string): string {
    const tmp: string = sale + password;
    const hash: string = sha512(tmp);
    return hash;
  }

  static hash(str: string): string {
    const tmp = sha512(str);
    return tmp;
  }
}

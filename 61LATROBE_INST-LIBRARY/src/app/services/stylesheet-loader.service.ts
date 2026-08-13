import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StylesheetLoaderService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  public loadStylesheet(id: string, href: string): void {
    if (this.document.getElementById(id)) {
      return;
    }

    const link = this.document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;

    this.document.head.appendChild(link);
  }
}
import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { driver } from 'driver.js';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { StylesheetLoaderService } from '../services/stylesheet-loader.service';

@Component({
  selector: 'custom-guided-tour',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatRippleModule],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss'
})
export class GuidedTourComponent implements AfterViewInit {

  constructor(
    private matIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private stylesheetLoader: StylesheetLoaderService
  ) {}

  ngOnInit() {
    this.matIconRegistry.addSvgIconSet(
      this.sanitizer.bypassSecurityTrustResourceUrl(
        '/nde/custom/61LATROBE_INST-LATROBE_NDETEST/assets/icons/custom_icons.svg'
      )
    );

    this.stylesheetLoader.loadStylesheet(
      'driver-js-css',
      'https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css'
    );
  }

  async ngAfterViewInit() {
    // small delay helps in Primo (DOM can still be rendering)
    setTimeout(() => {
      //this.startTour();
    }, 100);
  }

  startTour() {
    const tour = driver({
      showProgress: true,
      animate: true, 
      popoverClass: 'ltu-tour',

      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',

      showButtons: ['next', 'previous', 'close'],
    });

    tour.setSteps([
      {
        element: '.search-wrapper',
        popover: {
          title: 'Search',
          description: 'Start your search here'
        }
      },
      {
        element: '.result-item',
        popover: {
          title: 'Results',
          description: 'These are your results'
        }
      }
    ]);

    tour.drive();
  }
}

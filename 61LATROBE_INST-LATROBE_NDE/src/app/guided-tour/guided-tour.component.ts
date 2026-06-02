import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { driver } from 'driver.js';
import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { StylesheetLoaderService } from '../services/stylesheet-loader.service';

@Component({
  selector: 'custom-guided-tour',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [MatIconModule, MatButtonModule, MatRippleModule],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss'
})
export class GuidedTourComponent implements AfterViewInit {

  constructor(
    private stylesheetLoader: StylesheetLoaderService
  ) {}

  ngOnInit() {
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

      nextBtnText: 'Next <span class="material-icons">chevron_right</span>',
      prevBtnText: '<span class="material-icons">chevron_left</span> Back',
      doneBtnText: 'Done <span class="material-icons">check</span>',

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

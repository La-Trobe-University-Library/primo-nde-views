import { Component, AfterViewInit, ViewEncapsulation, OnDestroy, OnInit } from '@angular/core';
import { driver } from 'driver.js';
import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StylesheetLoaderService } from '../services/stylesheet-loader.service';

import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'custom-guided-tour',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [MatIconModule, MatButtonModule, MatRippleModule, MatTooltipModule],
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss'
})
export class GuidedTourComponent implements AfterViewInit, OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private tour: any;
  public tourType:string = '';
  public tooltipText: string = '';
  private previousTourType: string = '';


  constructor(
    private stylesheetLoader: StylesheetLoaderService,
    private store: Store<any>
  ) {}

  ngOnInit() {
    // load driver.js base stylesheet from CDN
    this.stylesheetLoader.loadStylesheet(
      'driver-js-css',
      'https://cdn.jsdelivr.net/npm/driver.js@latest/dist/driver.css'
    );

    // set up the tour instance
    this.setupTour();

    // listen for URL changes to update tour steps if needed
    this.store
      .select(state => state?.router?.state?.url)
      .pipe(takeUntil(this.destroy$))
      .subscribe(routerUrl => {
        this.updateTourSteps(routerUrl);
      });
  }

  async ngAfterViewInit() {
    // check whether a URL param is set to trigger the tour
    const urlParams = new URLSearchParams(window.location.search);
    const tourParam = urlParams.get('startTour');

    if (tourParam === '1') {
      // small delay helps in Primo (DOM can still be rendering)
      setTimeout(() => {  
          this.startTour();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupTour() {
    // set up the tour instance
    this.tour = driver({
      showProgress: true,
      animate: true, 
      popoverClass: 'ltu-tour',

      nextBtnText: 'Next <span class="material-icons">chevron_right</span>',
      prevBtnText: '<span class="material-icons">chevron_left</span> Back',
      doneBtnText: 'Done <span class="material-icons">check</span>',

      showButtons: ['next', 'previous', 'close'],
    });
  }

  private updateTourSteps(url: string) {
    console.log('Updating tour steps for URL:', url);

    // clear the tour type & tooltip
    this.previousTourType = this.tourType;
    this.tourType = '';
    this.tooltipText = '';
    
    // assign the tour steps based on the URL
    let currentSteps: any[] = [];
    if (url.includes('/home')) {
      // collections home page
      this.tourType = 'home';
      this.tooltipText = 'Tour the Library collections search page';
      currentSteps = this.searchHomeSteps;
    } else if (url.includes('/search')) {
      // collections search results page
      this.tourType = 'search results';
      this.tooltipText = 'Tour the Library collections search results page';
      currentSteps = this.searchResultsSteps;
    } else if (url.includes('/dbsearch')) {
      if (url.includes('query=')) {
        // database results page
        this.tourType = 'dbsearch results';
        this.tooltipText = 'Tour the database search results page';
        currentSteps = this.databaseResultsSteps;
      } else {
        // database home page
        this.tourType = 'dbsearch';
        this.tooltipText = 'Tour the database search page';
        currentSteps = this.databaseHomeSteps;
      }
    } else if (url.includes('/npsearch')) {
      if (url.includes('query=')) {
        // newspaper results page
        this.tourType = 'npsearch results';
        this.tooltipText = 'Tour the newspaper articles search results page';
        currentSteps = this.newspaperResultsSteps;
      } else {
        // newspaper home page
        this.tourType = 'npsearch';
        this.tooltipText = 'Tour the newspaper articles search page';
        currentSteps = this.newspaperHomeSteps;
      }
    } else if (url.includes('/browse')) {
      if (url.includes('browseQuery=')) {
        // browse results page
        this.tourType = 'browse results';
        this.tooltipText = 'Tour the browse results page';
        currentSteps = this.browseResultsSteps;
      } else {
        // browse home page
        this.tourType = 'browse';
        this.tooltipText = 'Tour the browse page';
        currentSteps = this.browseHomeSteps;
      }
    } else if (url.includes('/collectionDiscovery')) {
      if (url.includes('query=') && url.includes('collectionId=')) {
        // featured collection listing results page
        this.tourType = 'collection listing results';
        this.tooltipText = 'Tour the featured collections listing search results page';
        currentSteps = this.collectionListingResultsSteps;
      } else if (url.includes('query=')) {
        // featured collection results page
        this.tourType = 'collection results';
        this.tooltipText = 'Tour the featured collections search results page';
        currentSteps = this.collectionResultsSteps;
      } else if (url.includes('collectionId=')) {
        // featured collection listing page
        this.tourType = 'collection listing';
        this.tooltipText = 'Tour the featured collections listing page';
        currentSteps = this.collectionListingsSteps;
      } else {
        // featured collection home page
        this.tourType = 'collection';
        this.tooltipText = 'Tour the featured collections page';
        currentSteps = this.collectionHomeSteps;
      }
    } else if (url.includes('/blankIll')) {
      // document delivery page
      this.tourType = 'document delivery';
      this.tooltipText = 'Tour the document delivery page';
      currentSteps = this.docDeliverySteps;
    }

    console.log('Tour type set to:', this.tourType);

    if(this.previousTourType !== this.tourType || (this.previousTourType == '' && this.tourType != '')) {
      console.log('Tour type changed from', this.previousTourType || '[blank]', 'to', this.tourType);

      // the type of tour has changed, so set the tour steps
      this.tour.setSteps(currentSteps);
    }
  }

  startTour() {
    // start the tour
    this.tour.drive();
  }

  private searchHomeSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Search home',
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
  ];

  private searchResultsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Search results',
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
  ];

  private databaseHomeSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Database home',
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
  ];

  private databaseResultsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Database results',
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
  ];

  private newspaperHomeSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Newspaper home',
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
  ];

  private newspaperResultsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Newspaper results',
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
  ];

  private browseHomeSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Browse home',
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
  ];

  private browseResultsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Browse results',
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
  ];

  private collectionHomeSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Collection home',
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
  ];

  private collectionListingResultsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Collection listing results',
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
  ];

  private collectionResultsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Collection results',
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
  ];

  private collectionListingsSteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Collection listings',
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
  ];

  private docDeliverySteps: any[] = [
    {
      element: '.search-wrapper',
      popover: {
        title: 'Document delivery',
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
  ];
}
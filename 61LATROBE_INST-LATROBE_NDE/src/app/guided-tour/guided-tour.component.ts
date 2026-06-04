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
  public buttonLabel: string = '';
  public buttonIcon: string = '';
  public tooltipText: string = '';
  private previousTourType: string = '';

  private isMobileView: boolean = false;
  private isSmallView: boolean = false;

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
      disableActiveInteraction: true,
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
    this.buttonLabel = '';
    this.buttonIcon = '';
    this.tooltipText = '';

    // check whether Primo is showing its 'mobile' (xs) view
    this.isMobileView = document.querySelector('nde-app-root.XSmall') != null;
    this.isSmallView = document.querySelector('nde-app-root.Small') != null;

    console.log('Is mobile view:', this.isMobileView);
    console.log('Is small view:', this.isSmallView);
    
    // assign the tour steps based on the URL
    let currentSteps: any[] = [];
    if (url.includes('/home?')) {
      // collections home page
      this.tourType = 'home';
      this.tooltipText = 'Tour the Library collections search page';
      currentSteps = this.searchHomeSteps;
    } else if (url.includes('/search?')) {
      if (url.includes('browseQuery=')) {
        // browse search results page
        this.tourType = 'browse results';
        this.tooltipText = 'Tour the browse results page';
        currentSteps = this.browseResultsSteps;
      } else {
        // collections search results page
        this.tourType = 'search results';
        this.tooltipText = 'Tour the Library collections search results page';
        currentSteps = this.searchResultsSteps;
      }
    } else if (url.includes('/dbsearch?')) {
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
    } else if (url.includes('/npsearch?')) {
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
    } else if (url.includes('/browse?')) {
      if (url.includes('browseQuery=')) {
        // browse list page
        this.tourType = 'browse list';
        this.tooltipText = 'Tour the browse list page';
        currentSteps = this.browseListSteps;
      } else {
        // browse home page
        this.tourType = 'browse';
        this.tooltipText = 'Tour the browse page';
        currentSteps = this.browseHomeSteps;
      }
    } else if (url.includes('/collectionDiscovery?')) {
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
    } else if (url.includes('/blankIll?')) {
      // document delivery page
      this.tourType = 'document delivery';
      this.tooltipText = 'Tour the document delivery page';
      currentSteps = this.docDeliverySteps;
    } else if (url.includes('/account')) {
      if (url.includes('/overview')) {
        // account overview page
        this.tourType = 'account overview';
        this.tooltipText = 'Tour the account overview page';
        currentSteps = this.accountOverviewSteps;
      } else if (url.includes('/loans')) {
        // account loans page
        this.tourType = 'account loans';
        this.tooltipText = 'Tour the \'Loans\' page';
        currentSteps = this.accountLoansSteps;
      } else if (url.includes('/requests')) {
        // account requests page
        this.tourType = 'account requests';
        this.tooltipText = 'Tour the \'Requests\' page';
        currentSteps = this.accountRequestsSteps;
      } else if (url.includes('/fines')) {
        // account fines page
        this.tourType = 'account fines';
        this.tooltipText = 'Tour the \'Fines\' page';
        currentSteps = this.accountFinesSteps;
      } else if (url.includes('/favorites')) {
        // account favorites page
        this.tourType = 'account favorites';
        this.tooltipText = 'Tour the \'Saved items\' page';
        currentSteps = this.accountFavoritesSteps;
      } else if (url.includes('/searchHistory')) {
        // account search history page
        this.tourType = 'account search history';
        this.tooltipText = 'Tour the \'Search history\' page';
        currentSteps = this.accountSearchHistorySteps;
      } else if (url.includes('/savedSearches')) {
        // account saved searches page
        this.tourType = 'account saved searches';
        this.tooltipText = 'Tour the \'Saved searches\' page';
        currentSteps = this.accountSavedSearchesSteps;
      } else if (url.includes('/settings')) {
        // account settings page
        this.tourType = 'account settings';
        this.tooltipText = 'Tour the \'Settings\' page';
        currentSteps = this.accountSettingsSteps;
      }
    } else if (url.includes('/fulldisplay?')) {
      // item full display page (from search results)
      this.tourType = 'full display';
      this.tooltipText = 'Tour the item page';
      currentSteps = this.fullDisplaySteps;
    } else if (url.includes('/dbfulldisplay?')) {
      // DB item full display page (from search results)
      this.tourType = 'database full display';
      this.tooltipText = 'Tour the database item page';
      currentSteps = this.dbFullDisplaySteps;
    } else if (url.includes('/npfulldisplay?')) {
      // Newspaper item full display page (from search results)
      this.tourType = 'newspaper full display';
      this.tooltipText = 'Tour the newspaper item page';
      currentSteps = this.npFullDisplaySteps;
    } else if (url.includes('/researchAssistant?')) {
      // Research assistant page
      this.tourType = 'research assistant';
      this.buttonIcon = 'info_outline';
      this.buttonLabel = 'Find out more';
      this.tooltipText = 'Helpful information about using the research assistant';
      currentSteps = this.researchAssistantSteps;
    }

    if(this.previousTourType !== this.tourType || (this.previousTourType == '' && this.tourType != '')) {
      console.log('Tour type changed from', this.previousTourType || '[blank]', 'to', this.tourType);

      // the type of tour has changed, so set the tour steps
      this.tour.setSteps(currentSteps);
    }
  }

  startTour() {
    // start the tour
    if(this.tour) this.tour.drive();
  }

  private get searchHomeSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function
    const menuDelay = 200; // delay in milliseconds to allow the menu to open before moving to the next step

    return [
      {
        element: '.search-wrapper',
        popover: {
          title: "Welcome to the Library collections search",
          description: "This search allows you to find any resource within the library's many collections.",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: this.isMobileView ? '.main-menu-mobile-btn' : 'nav [data-qa="main-menu_links"]',//'.show-more-btn',
        popover: {
          title: "Check the menu",
          description: "<p>The main menu lets you change the type of search you're performing (e.g. search all collections, databases or newspaper articles) as well as allowing you to request items from another library.</p><p>Select the 'More' menu item to view the full main menu.</p><p>Note that when you're in 'mobile' view, some options that are usually on the page (e.g. the 'Advanced search') are within this menu instead.</p>",
          side: "bottom",
          align: "end",
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: ".search-bar-wrapper",
        popover: {
          title: "Search form",
          description: "<p>Enter the term that you want to search for.</p><p>You can also 'Search by voice' in supported web browsers (Chrome or Edge are recommended).</p>",
          side: "bottom",
          align: "center"
        }
      }, 
      {
        element: "#search-dropdown-container-button-scopes-dropdown",
        popover: {
          title: "Online or physical?",
          description: "<p>If you would like to restrict your search to only online resources or only physical ones, select the appropriate option in this drop-down.</p>",
          side: "bottom",
          align: "center",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }, 
      // FOLLOWING ELEMENTS ARE EITHER IN MENU OR ON THE PAGE
      {
        element: this.isMobileView ? ".show-more-main-menu-out-inner-wrapper-ul > li:nth-child(3) button" : "button[data-qa='natural-language-search-button']",
        popover: {
          title: "Search using natural language",
          description: "<p>If you would like to describe what you're looking for in your own words, this feature will convert it to a structured search query.</p>",
          side: "bottom",
          align: "end",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go back to the previous step
                scope.tour.movePrevious();
              }, menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isMobileView ? ".show-more-main-menu-out-inner-wrapper-ul > li:first-child button" : "button[data-qa='advanced_search_button']",
        popover: {
          title: "Need more search fields?",
          description: "Switch between a simple search and an advanced search that lets you specify more filters and criteria.",
          side: "bottom",
          align: this.isMobileView ? "start" : "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      // FOLLOWING ELEMENTS ARE ON THE PAGE
      {
        element: "#user-area-button",
        popover: {
          title: "Your library account",
          description: "Sign in to access your library account, where you can view the status of any loans or requests for library resources.",
          side: "bottom",
          align: this.isMobileView ? "start" : "end",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the previous element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // go back to the previous step
                scope.tour.movePrevious();
              }, menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: ".s-lch-widget-float-btn",
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your Library collections search.",
          side: "bottom",
          align: "center",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }, 
      // FOLLOWING ELEMENTS ARE EITHER IN MENU OR ON THE PAGE
      {
        element: this.isMobileView ? ".show-more-main-menu-out-inner-wrapper-ul > li:nth-child(2) button" : "button[data-qa='report_a_problem_button']",
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource or logging in, select 'Report a problem' to report it to the library.",
          side: "right",
          align: "end",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go back to the previous step
                scope.tour.movePrevious();
              }, menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, menuDelay); 
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      // FOLLOWING ELEMENTS ARE ON THE PAGE
      {
        element: "nde-logo",
        popover: {
          title: "Library website",
          description: "To return to the library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the previous element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // go back to the previous step
                scope.tour.movePrevious();
              }, menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: ".guide-btn",
        popover: {
          title: "That's all for now",
          description: "Thanks for taking the tour. You can restart it at any time from here.",
          side: "bottom",
          align: "end",
          popoverClass: 'ltu-tour ltu-end-tour'
        }
      }
    ];
  }

  private get searchResultsSteps(): any[] {
    return [
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
  }

  private get databaseHomeSteps(): any[] {
    return [
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
  }

  private get databaseResultsSteps(): any[] {
    return [
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
  }

  private get newspaperHomeSteps(): any[] {
    return [
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
  }

  private get newspaperResultsSteps(): any[] {
    return [
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
  }

  private get browseHomeSteps(): any[] {
    return [
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
  }

  private get browseListSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Browse list',
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

  private get browseResultsSteps(): any[] {
    return [
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
  }

  private get collectionHomeSteps(): any[] {
    return [
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
  }

  private get collectionListingResultsSteps(): any[] {
    return [
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
  }

  private get collectionResultsSteps(): any[] {
    return [
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
  }

  private get collectionListingsSteps(): any[] {
    return [
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
  }

  private get docDeliverySteps(): any[] {
    return [
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

  private get accountOverviewSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account overview',
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

  private get accountLoansSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account loans',
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

  private get accountRequestsSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account requests',
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

  private get accountFinesSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account fines',
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

  private get accountFavoritesSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account favorites',
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

  private get accountSearchHistorySteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account search history',
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

  private get accountSavedSearchesSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account saved searches',
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

  private get accountSettingsSteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Account settings',
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

  private get fullDisplaySteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Full display',
          description: 'This is the full display view of an item'
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

  private get dbFullDisplaySteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Database full display',
          description: 'This is the full display view of a database item'
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

  private get npFullDisplaySteps(): any[] {
    return [
      {
        element: '.search-wrapper',
        popover: {
          title: 'Newspaper full display',
          description: 'This is the full display view of a newspaper item'
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

  private get researchAssistantSteps(): any[] {
    return [
      {
        popover: {
          title: 'Research assistant',
          description: 'This is the research assistant page'
        }
      },
      {
        popover: {
          title: 'Results',
          description: 'These are your results'
        }
      }
    ];
  }
}
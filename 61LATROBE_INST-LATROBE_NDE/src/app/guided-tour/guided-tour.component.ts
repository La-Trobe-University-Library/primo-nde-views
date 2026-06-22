import { Component, AfterViewInit, ViewEncapsulation, OnDestroy, OnInit } from '@angular/core';
import { driver } from 'driver.js';
import { MatIconModule } from '@angular/material/icon';

import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StylesheetLoaderService } from '../services/stylesheet-loader.service';

import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, fromEvent } from 'rxjs';

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
  private currentUrl:string = '';
  public tourType:string = '';
  public buttonLabel: string = '';
  public buttonIcon: string = '';
  public tooltipText: string = '';
  private previousTourType: string = '';
  private currentSize: string = '';
  private menuDelay = 400; // delay in milliseconds to allow the menu to open before moving to the next step

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
    
    /* disabling resize handling as it might be affecting the main menu (this is inconclusive, as the menu issue occurs when this is commented out too)
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(200),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleResize();
      });
    */
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

  private handleResize(): void {
    // check whether the window view has changed between mobile/small/desktop
    var isMobile = document.querySelector('nde-app-root.XSmall') != null;
    var isSmall = document.querySelector('nde-app-root.Small') != null;
    var newSize = isMobile ? 'mobile' : isSmall ? 'small' : 'desktop';

    if(this.currentSize !== newSize) {
      //console.log('Window resized, view size changed from', this.currentSize || '[blank]', 'to', newSize, '- refreshing tour steps');

      // stop any active tour as the step targets may no longer be correct in the new view
      if(this.tour.isActive()) this.tour.destroy()
      
      // reapply the steps as the view has changed (e.g. mobile vs desktop) which may require different step targets and actions
      this.updateTourSteps('', true);
    }
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

  private updateTourSteps(url: string = '', forceStepUpdate: boolean = false): void {
    if(url == '') url = window.location.href; // fallback to the current window URL

    this.currentUrl = url;

    console.log('Updating tour steps for URL:', url);

    // clear the tour type & tooltip
    this.previousTourType = this.tourType;
    this.tourType = '';
    this.buttonLabel = '';
    this.buttonIcon = '';
    this.tooltipText = '';

    // check whether Primo is showing its 'mobile' (xs) or 'small' view
    this.isMobileView = document.querySelector('nde-app-root.XSmall') != null;
    this.isSmallView = document.querySelector('nde-app-root.Small') != null;
    this.currentSize = this.isMobileView ? 'mobile' : this.isSmallView ? 'small' : 'desktop';

    //console.log('Is mobile view:', this.isMobileView);
    //console.log('Is small view:', this.isSmallView);
    
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
      } else if(url.includes('isNLS=true')) { 
        // natural language results page
        this.tourType = 'natural lang search results';
        this.tooltipText = 'Tour the generated query search results page';
        currentSteps = this.generatedResultsSteps;
      } else if(url.includes('mode=advanced')) { 
        // advanced search results page
        this.tourType = 'advanced search results';
        this.tooltipText = 'Tour the advanced search results page';
        currentSteps = this.advSearchResultsSteps;
      } else {
        // collections search results page
        this.tourType = 'search results';
        this.tooltipText = 'Tour the search results page';
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

    if(this.previousTourType !== this.tourType || (this.previousTourType == '' && this.tourType != '') || forceStepUpdate) {
      if(forceStepUpdate) {
        console.log('Tour steps refreshed');
      } else {
        console.log('Tour type changed from', this.previousTourType || '[blank]', 'to', this.tourType);
      }

      // the type of tour has changed, so set the tour steps
      this.tour.setSteps(currentSteps);
    }
  }

  startTour(step: number = 0): void {
    // start the tour
    if(this.tour) this.tour.drive(step);
  }

  private get searchHomeSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function
    
    return [
      {
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
              }, scope.menuDelay);
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
              }, scope.menuDelay);
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
              }, scope.menuDelay);
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
              }, scope.menuDelay);
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
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
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
          description: "If you have encountered a problem with a search, resource or signing in, select 'Report a problem' to report it to the library.",
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
              }, scope.menuDelay);
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
              }, scope.menuDelay); 
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
          description: "To return to the Library website, select the La Trobe University logo.",
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
              }, scope.menuDelay);
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
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        element: '.search-result-item',
        popover: {
          title: 'Library collections search results',
          description: 'The results of your library collections search are listed on the page. Select an item from the results to see its details.',
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: this.isMobileView ? 'nde-mobile-filters-toggle button' : '#allFilterToggleButton',
        popover: {
          title: "View filters",
          description: "Select this button to show/hide the filters that you can apply to this search.",
          side: "right",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to expand the filters
              var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to open
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              var openedFilterBtn = document.querySelector('#allFilterToggleButton.all-filters-open') as HTMLElement;

              if(openedFilterBtn) {
                // continue to the next step
                scope.tour.moveNext();
              } else {
                // we want to expand the filters
                var filterBtn = document.querySelector('#allFilterToggleButton') as HTMLElement;
                if(filterBtn) filterBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              }
            }
          }
        }
      },
      {
        element: this.isMobileView ? '#filters-panel h2' : 'nde-search-filters-side-nav',
        popover: {
          title: "Narrow your results",
          description: "Apply filters (such as 'Peer-reviewed' and 'Resource type') to narrow down your search.",
          side: "right",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            // scroll so first item is visible
            const results = document.querySelector('.search-container');
            if(results) results.scrollIntoView();

            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }
    ];

    if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: '.search-result-item button[data-qa="mobile-actions-btn"]',
          popover: {
            title: "Item actions",
            description: "Select the '3-dot' menu button to view the actions for an item.",
            side: "left",
            align: "center",
            onPrevClick: function(element: any, step: any, options: any): void {
              if(scope.isMobileView) {
                // we want to expand the filters
                var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.movePrevious();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.movePrevious();
              }
            },
            onNextClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.moveNext();
              }
            }
          }
        }
      );
    }
    
    // FOLLOWING ELEMENTS ARE DIFFERENT DEPENDING ON THE VIEW
    steps.push(
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet nde-record-actions nde-save-to-favorites' : '.search-result-item nde-record-actions nde-save-to-favorites',
        popover: {
          title: "Save to favourites",
          description: "You can save an item to your favourites to make it easier to find again.",
          side: "left",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the previous step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available export options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available export options"]',
        popover: {
          title: "Export",
          description: "These options allow you to export or share the item details.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Citation of"]' : '.search-result-item nde-record-actions button[aria-label^="Citation of"]',
        popover: {
          title: "View citation formats",
          description: "If you need to cite an item in your work, you can select its citation button to view its details in various standard reference formats.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available share options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available share options"]',
        popover: {
          title: "Sharing options",
          description: "Get a permalink (permanent link) for an item or view a QR code that you can scan to view the item's details.",
          side: "left",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: '.np-search-container',
        popover: {
          title: "Search newspaper articles",
          description: "A standard library search doesn't include newspaper articles. If you would like to search newspapers, you can select this link.",
          side: "top",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
        }
      },
      {
        element: 'nde-search-bar-presenter',
        popover: {
          title: "Search form",
          description: "If you didn't get the results that you were after, try a new search. You can always add more search parameters using an Advanced search.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: 'button.s-lch-widget-float-btn',
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your library search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: scope.isMobileView ? '.show-more-main-menu-out-inner-wrapper-ul li:nth-child(2) button' : 'nde-report-a-problem',
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource, or signing in, select 'Report a problem' to report it to the library.",
          side: "left",
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
              }, scope.menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // go to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-logo',
        popover: {
          title: "Library website",
          description: "To return to the Library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the prev step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the prev step
              scope.tour.movePrevious();
            }
          }
        }
      }
    );
    
    return steps;
  }

  private get advSearchResultsSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        element: 'nde-search-summary .edit-button',
        popover: {
          title: 'Edit search criteria',
          description: 'You can view and modify the search criteria to perform another advanced search.',
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide',
          side: "bottom",
          align: "end"
        }
      },
      {
        element: 'nde-search-summary .simple-search-button',
        popover: {
          title: 'Simple search',
          description: 'Select this button to perform a new simple search.',
          side: "bottom",
          align: "center"
        }
      },
      {
        element: '.search-result-item',
        popover: {
          title: 'Search results',
          description: 'The results of your search are listed on the page. Select an item from the results to see its details.',
          side: "top",
          align: "center"
        }
      },
      {
        element: this.isMobileView ? 'nde-mobile-filters-toggle button' : '#allFilterToggleButton',
        popover: {
          title: "View filters",
          description: "Select this button to show/hide the filters that you can apply to this search.",
          side: "right",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to expand the filters
              var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to open
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              var openedFilterBtn = document.querySelector('#allFilterToggleButton.all-filters-open') as HTMLElement;

              if(openedFilterBtn) {
                // continue to the next step
                scope.tour.moveNext();
              } else {
                // we want to expand the filters
                var filterBtn = document.querySelector('#allFilterToggleButton') as HTMLElement;
                if(filterBtn) filterBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              }
            }
          }
        }
      },
      {
        element: this.isMobileView ? '#filters-panel h2' : 'nde-search-filters-side-nav',
        popover: {
          title: "Narrow your results",
          description: "Apply filters (such as 'Peer-reviewed' and 'Resource type') to narrow down your search.",
          side: "right",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            // scroll so first item is visible
            const results = document.querySelector('.search-container');
            if(results) results.scrollIntoView();

            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
    ];

   if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: '.search-result-item button[data-qa="mobile-actions-btn"]',
          popover: {
            title: "Item actions",
            description: "Select the '3-dot' menu button to view the actions for an item.",
            side: "left",
            align: "center",
            onPrevClick: function(element: any, step: any, options: any): void {
              if(scope.isMobileView) {
                // we want to expand the filters
                var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.movePrevious();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.movePrevious();
              }
            },
            onNextClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.moveNext();
              }
            }
          }
        }
      );
    }
    
    // FOLLOWING ELEMENTS ARE DIFFERENT DEPENDING ON THE VIEW
    steps.push(
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet nde-record-actions nde-save-to-favorites' : '.search-result-item nde-record-actions nde-save-to-favorites',
        popover: {
          title: "Save to favourites",
          description: "You can save an item to your favourites to make it easier to find again.",
          side: "left",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the previous step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available export options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available export options"]',
        popover: {
          title: "Export",
          description: "These options allow you to export or share the item details.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Citation of"]' : '.search-result-item nde-record-actions button[aria-label^="Citation of"]',
        popover: {
          title: "View citation formats",
          description: "If you need to cite an item in your work, you can select its citation button to view its details in various standard reference formats.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available share options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available share options"]',
        popover: {
          title: "Sharing options",
          description: "Get a permalink (permanent link) for an item or view a QR code that you can scan to view the item's details.",
          side: "left",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: '.np-search-container',
        popover: {
          title: "Search newspaper articles",
          description: "A standard library search doesn't include newspaper articles. If you would like to search newspapers, you can select this link.",
          side: "top",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: 'nde-search-bar-presenter',
        popover: {
          title: "Search form",
          description: "If you didn't get the results that you were after, try a new search. You can always add more search parameters using an Advanced search.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: 'button.s-lch-widget-float-btn',
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your library search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: scope.isMobileView ? '.show-more-main-menu-out-inner-wrapper-ul li:nth-child(2) button' : 'nde-report-a-problem',
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource, or signing in, select 'Report a problem' to report it to the library.",
          side: "left",
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
              }, scope.menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // go to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-logo',
        popover: {
          title: "Library website",
          description: "To return to the Library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the prev step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the prev step
              scope.tour.movePrevious();
            }
          }
        }
      }
    );
    
    return steps;
  }

  private get generatedResultsSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        element: 'nde-search-summary .generated-query-button',
        popover: {
          title: 'Generated query',
          description: 'View the criteria that were generated to perform this search. You can add, remove or modify these fields as desired to perform a new advanced search.',
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide',
          side: "bottom",
          align: "end"
        }
      },
      {
        element: 'nde-search-summary .edit-button',
        popover: {
          title: 'Reword your search description',
          description: 'You can view and modify the description that you used to generate a new advanced search.',
          side: "bottom",
          align: "center"
        }
      },
      {
        element: 'nde-search-summary .simple-search-button',
        popover: {
          title: 'Simple search',
          description: 'Select this button to perform a new simple search.',
          side: "bottom",
          align: "center"
        }
      },
      {
        element: '.search-result-item',
        popover: {
          title: 'Search results',
          description: 'The results of your search are listed on the page. Select an item from the results to see its details.',
          side: "top",
          align: "center"
        }
      },
      {
        element: this.isMobileView ? 'nde-mobile-filters-toggle button' : '#allFilterToggleButton',
        popover: {
          title: "View filters",
          description: "Select this button to show/hide the filters that you can apply to this search.",
          side: "right",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to expand the filters
              var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to open
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              var openedFilterBtn = document.querySelector('#allFilterToggleButton.all-filters-open') as HTMLElement;

              if(openedFilterBtn) {
                // continue to the next step
                scope.tour.moveNext();
              } else {
                // we want to expand the filters
                var filterBtn = document.querySelector('#allFilterToggleButton') as HTMLElement;
                if(filterBtn) filterBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              }
            }
          }
        }
      },
      {
        element: this.isMobileView ? '#filters-panel h2' : 'nde-search-filters-side-nav',
        popover: {
          title: "Narrow your results",
          description: "Apply filters (such as 'Peer-reviewed' and 'Resource type') to narrow down your search.",
          side: "right",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            // scroll so first item is visible
            const results = document.querySelector('.search-container');
            if(results) results.scrollIntoView();

            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }
    ];

   if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: '.search-result-item button[data-qa="mobile-actions-btn"]',
          popover: {
            title: "Item actions",
            description: "Select the '3-dot' menu button to view the actions for an item.",
            side: "left",
            align: "center",
            onPrevClick: function(element: any, step: any, options: any): void {
              if(scope.isMobileView) {
                // we want to expand the filters
                var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.movePrevious();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.movePrevious();
              }
            },
            onNextClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.moveNext();
              }
            }
          }
        }
      );
    }
    
    // FOLLOWING ELEMENTS ARE DIFFERENT DEPENDING ON THE VIEW
    steps.push(
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet nde-record-actions nde-save-to-favorites' : '.search-result-item nde-record-actions nde-save-to-favorites',
        popover: {
          title: "Save to favourites",
          description: "You can save an item to your favourites to make it easier to find again.",
          side: "left",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the previous step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available export options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available export options"]',
        popover: {
          title: "Export",
          description: "These options allow you to export or share the item details.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Citation of"]' : '.search-result-item nde-record-actions button[aria-label^="Citation of"]',
        popover: {
          title: "View citation formats",
          description: "If you need to cite an item in your work, you can select its citation button to view its details in various standard reference formats.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available share options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available share options"]',
        popover: {
          title: "Sharing options",
          description: "Get a permalink (permanent link) for an item or view a QR code that you can scan to view the item's details.",
          side: "left",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: '.np-search-container',
        popover: {
          title: "Search newspaper articles",
          description: "A standard library search doesn't include newspaper articles. If you would like to search newspapers, you can select this link.",
          side: "top",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: 'nde-search-bar-container',
        popover: {
          title: "Search form",
          description: "If you didn't get the results that you were after, try a new search. You can always add more search parameters using an Advanced search.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: 'button.s-lch-widget-float-btn',
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your library search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: scope.isMobileView ? '.show-more-main-menu-out-inner-wrapper-ul li:nth-child(2) button' : 'nde-report-a-problem',
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource, or signing in, select 'Report a problem' to report it to the library.",
          side: "left",
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
              }, scope.menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // go to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-logo',
        popover: {
          title: "Library website",
          description: "To return to the Library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the prev step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the prev step
              scope.tour.movePrevious();
            }
          }
        }
      }
    );
    
    return steps;
  }

  private get databaseHomeSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        popover: {
          title: "Welcome to the Databases search",
          description: "This search allows you to find databases within the Library's many collections.",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: "section.general-search-header",
        popover: {
          title: "Search field",
          description: "<p>Enter the term that you want to search for.</p><p>Note that this will only search for databases, not their contents.</p>",
          side: "bottom",
          align: "center"
        }
      }
    ];

    if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: 'nde-journal-database-layout-component section button.open-dialog-button',
          popover: {
            title: "Starting letters and categories",
            description: "Select this button to search by the database's starting letter or by category.",
            side: "right",
            align: "center"
          }
        }
      );
    } else {
      steps.push(
        {
          element: "nde-atoz",
          popover: {
            title: "Know what it starts with?",
            description: "<p>Search titles starting with these characters.</p>",
            side: "right",
            align: "start"
          }
        },
        {
          element: "nde-categories",
          popover: {
            title: "Database categories",
            description: "<p>Browse by database category. Select the arrow next to a category to see any sub-categories.</p>",
            side: "right",
            align: "start"
          }
        }
      );
    }
    
    steps.push(
      {
        element: ".s-lch-widget-float-btn",
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your Library collections search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
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
          description: "If you have encountered a problem with a search, resource or signing in, select 'Report a problem' to report it to the library.",
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
              }, scope.menuDelay);
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
              }, scope.menuDelay); 
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
          description: "To return to the Library website, select the La Trobe University logo.",
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
              }, scope.menuDelay);
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
    );

    return steps;
  }

  private get databaseResultsSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        element: '.search-result-item',
        popover: {
          title: 'Database search results',
          description: 'The results of your search are listed on the page. Select an item from the results to see its details.',
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      }
    ];

    if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: '.search-result-item button[data-qa="mobile-actions-btn"]',
          popover: {
            title: "Item actions",
            description: "Select the '3-dot' menu button to view the actions for an item.",
            side: "left",
            align: "center",
            onNextClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.moveNext();
              }
            }
          }
        }
      );
    }
    
    // FOLLOWING ELEMENTS ARE DIFFERENT DEPENDING ON THE VIEW
    steps.push(
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet nde-record-actions nde-save-to-favorites' : '.search-result-item nde-record-actions nde-save-to-favorites',
        popover: {
          title: "Save to favourites",
          description: "You can save an item to your favourites to make it easier to find again.",
          side: "left",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the previous step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available export options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available export options"]',
        popover: {
          title: "Export",
          description: "These options allow you to export or share the item details.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Citation of"]' : '.search-result-item nde-record-actions button[aria-label^="Citation of"]',
        popover: {
          title: "View citation formats",
          description: "If you need to cite an item in your work, you can select its citation button to view its details in various standard reference formats.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available share options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available share options"]',
        popover: {
          title: "Sharing options",
          description: "Get a permalink (permanent link) for an item or view a QR code that you can scan to view the item's details.",
          side: "left",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }
    );

    if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: 'nde-journal-database-layout-component section button.open-dialog-button',
          popover: {
            title: "Starting letters and categories",
            description: "Select this button to search by the database's starting letter or by category.",
            side: "right",
            align: "center",
            onPrevClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.movePrevious();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.movePrevious();
              }
            }
          }
        }
      );
    } else {
      steps.push(
        {
          element: "nde-atoz",
          popover: {
            title: "Know what it starts with?",
            description: "<p>Search titles starting with these characters.</p>",
            side: "right",
            align: "start"
          }
        },
        {
          element: "nde-categories",
          popover: {
            title: "Database categories",
            description: "<p>Browse by database category. Select the arrow next to a category to see any sub-categories.</p>",
            side: "right",
            align: "start"
          }
        }
      );
    }

    steps.push(
      {
        element: 'section.general-search-header',
        popover: {
          title: "Search field",
          description: "<p>If you didn't get the results that you were after, try a new search term or select a letter/number to search databases whose name begins with that character.</p><p>You can also try searching the library collections, which will allow you to apply filters to narrow down your results.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: 'button.s-lch-widget-float-btn',
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your library search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: scope.isMobileView ? '.show-more-main-menu-out-inner-wrapper-ul li:nth-child(2) button' : 'nde-report-a-problem',
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource, or signing in, select 'Report a problem' to report it to the library.",
          side: "left",
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
              }, scope.menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // go to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-logo',
        popover: {
          title: "Library website",
          description: "To return to the Library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the prev step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the prev step
              scope.tour.movePrevious();
            }
          }
        }
      }
    );
    
    return steps;
  }

  private get newspaperHomeSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        popover: {
          title: "Welcome to the newspaper articles search",
          description: "This search allows you to find newspaper articles within the library's collections.",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: "section.general-search-header",
        popover: {
          title: "Search field",
          description: "<p>Enter the term that you want to search for.</p>",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: ".featured-newspapers-container",
        popover: {
          title: "Featured newspapers",
          description: "You may limit your search to within one of the featured newspapers.",
          side: "top",
          align: "center"
        }
      },
      {
        element: ".s-lch-widget-float-btn",
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your Library collections search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
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
          description: "If you have encountered a problem with a search, resource or signing in, select 'Report a problem' to report it to the library.",
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
              }, scope.menuDelay);
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
              }, scope.menuDelay); 
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
          description: "To return to the Library website, select the La Trobe University logo.",
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
              }, scope.menuDelay);
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

    return steps;
  }

  private get newspaperResultsSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        element: '.search-result-item',
        popover: {
          title: "Newspaper articles search results",
          description: "The results of your search are listed on the page. Select an item's title from the results to see its details.",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: this.isMobileView ? 'nde-mobile-filters-toggle button' : '#allFilterToggleButton',
        popover: {
          title: "View filters",
          description: "Select this button to show/hide the filters that you can apply to this search.",
          side: "right",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to expand the filters
              var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to open
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              var openedFilterBtn = document.querySelector('nde-search-filters-side-nav.visible') as HTMLElement;

              if(openedFilterBtn) {
                // continue to the next step
                scope.tour.moveNext();
              } else {
                // we want to expand the filters
                var filterBtn = document.querySelector('#allFilterToggleButton') as HTMLElement;
                if(filterBtn) filterBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              }
            }
          }
        }
      },
      {
        element: this.isMobileView ? 'nde-search-filters-side-nav h2' : 'nde-search-filters-side-nav',
        popover: {
          title: "Narrow your results",
          description: "Apply filters (such as 'Peer-reviewed' and 'Subject') to narrow down your search.",
          side: this.isMobileView ? "bottom" : "right",
          align: this.isMobileView ? "start" : "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            // scroll so first item is visible
            const results = document.querySelector('.search-container');
            if(results) results.scrollIntoView();

            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }
    ];

    if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: '.search-result-item button[data-qa="mobile-actions-btn"]',
          popover: {
            title: "Item actions",
            description: "Select the '3-dot' menu button to view the actions for an item.",
            side: "left",
            align: "center",
            onPrevClick: function(element: any, step: any, options: any): void {
              if(scope.isMobileView) {
                // we want to expand the filters
                var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.movePrevious();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.movePrevious();
              }
            },
            onNextClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.moveNext();
              }
            }
          }
        }
      );
    }
    
    // FOLLOWING ELEMENTS ARE DIFFERENT DEPENDING ON THE VIEW
    steps.push(
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet nde-record-actions nde-save-to-favorites' : '.search-result-item nde-record-actions nde-save-to-favorites',
        popover: {
          title: "Save to favourites",
          description: "You can save an item to your favourites to make it easier to find again.",
          side: "left",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the previous step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available export options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available export options"]',
        popover: {
          title: "Export",
          description: "These options allow you to export or share the item details.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Citation of"]' : '.search-result-item nde-record-actions button[aria-label^="Citation of"]',
        popover: {
          title: "View citation formats",
          description: "If you need to cite an item in your work, you can select its citation button to view its details in various standard reference formats.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available share options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available share options"]',
        popover: {
          title: "Sharing options",
          description: "Get a permalink (permanent link) for an item or view a QR code that you can scan to view the item's details.",
          side: "left",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-general-search-header > section',
        popover: {
          title: "Search form",
          description: "If you didn't get the results that you were after, try a new search.",
          side: "bottom",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: 'button.s-lch-widget-float-btn',
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your library search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: scope.isMobileView ? '.show-more-main-menu-out-inner-wrapper-ul li:nth-child(2) button' : 'nde-report-a-problem',
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource, or signing in, select 'Report a problem' to report it to the library.",
          side: "left",
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
              }, scope.menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // go to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-logo',
        popover: {
          title: "Library website",
          description: "To return to the Library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the prev step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the prev step
              scope.tour.movePrevious();
            }
          }
        }
      }
    );
    
    return steps;
  }

  private get browseHomeSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function
    
    return [
      {
        popover: {
          title: "Welcome to the browse search",
          description: "This search allows you to find a range of resources that are similar in a specific way (e.g. that have a simliar title, or have a similar call number).",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: "nde-search-box-presenter",
        popover: {
          title: "Search form",
          description: "<p>Enter the term that you want to search for.</p>",
          side: "bottom",
          align: "center"
        }
      }, 
      {
        element: "nde-search-contain-dropdown",
        popover: {
          title: "Search field",
          description: "<p>Select the drop-down to specify which field to use for the search.</p><p>Browsing by call number will provide a list of items that would normally appear on the shelf next to the call number that you specify.</p>",
          side: "bottom",
          align: "center"
        }
      }, 
      {
        element: ".s-lch-widget-float-btn",
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your Library collections search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
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
          description: "If you have encountered a problem with a search, resource or signing in, select 'Report a problem' to report it to the library.",
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
              }, scope.menuDelay);
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
              }, scope.menuDelay); 
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
          description: "To return to the Library website, select the La Trobe University logo.",
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
              }, scope.menuDelay);
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

  private get browseListSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function
    
    return [
      {
        element: "nde-browse-search-result",
        popover: {
          title: "Search results",
          description: "The results of your search are listed on the page. Select an item from the results to see the records it contains.",
          side: "top",
          align: "center",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: "nde-browse-search-container nav",
        popover: {
          title: "There's more",
          description: "Use the pagination buttons to move between pages of results.",
          side: "bottom",
          align: "center"
        }
      }, 
      {
        element: "nde-general-search-header > section",
        popover: {
          title: "Search form",
          description: "If you didn't get the results that you were after, try a new search term.",
          side: "bottom",
          align: "center"
        }
      }, 
      {
        element: ".s-lch-widget-float-btn",
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your Library collections search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
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
          description: "If you have encountered a problem with a search, resource or signing in, select 'Report a problem' to report it to the library.",
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
              }, scope.menuDelay);
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
              }, scope.menuDelay); 
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
          description: "To return to the Library website, select the La Trobe University logo.",
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
              }, scope.menuDelay);
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

  private get browseResultsSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function

    var steps: any = [
      {
        element: '.search-result-item',
        popover: {
          title: 'Browse search results',
          description: 'The results of your browse search are listed on the page. Select an item from the results to see its details.',
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },
      {
        element: this.isMobileView ? 'nde-mobile-filters-toggle button' : '#allFilterToggleButton',
        popover: {
          title: "View filters",
          description: "Select this button to show/hide the filters that you can apply to this search.",
          side: "right",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to expand the filters
              var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to open
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              var openedFilterBtn = document.querySelector('#allFilterToggleButton.all-filters-open') as HTMLElement;

              if(openedFilterBtn) {
                // continue to the next step
                scope.tour.moveNext();
              } else {
                // we want to expand the filters
                var filterBtn = document.querySelector('#allFilterToggleButton') as HTMLElement;
                if(filterBtn) filterBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              }
            }
          }
        }
      },
      {
        element: this.isMobileView ? '#filters-panel h2' : 'nde-search-filters-side-nav',
        popover: {
          title: "Narrow your results",
          description: "Apply filters (such as 'Peer-reviewed' and 'Resource type') to narrow down your search.",
          side: "right",
          align: "center",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            // scroll so first item is visible
            const results = document.querySelector('.search-container');
            if(results) results.scrollIntoView();

            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('#close-facet-panel') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the nprevext step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      }
    ];

    if(scope.isSmallView || scope.isMobileView) {
      // add a step
      steps.push(
        {
          element: '.search-result-item button[data-qa="mobile-actions-btn"]',
          popover: {
            title: "Item actions",
            description: "Select the '3-dot' menu button to view the actions for an item.",
            side: "left",
            align: "center",
            onPrevClick: function(element: any, step: any, options: any): void {
              if(scope.isMobileView) {
                // we want to expand the filters
                var menuBtn = document.querySelector('nde-mobile-filters-toggle button') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to open
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.movePrevious();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.movePrevious();
              }
            },
            onNextClick: function(element: any, step: any, options: any): void {
              if(scope.isSmallView || scope.isMobileView) {
                // we want to open the menu so we can highlight the next element
                var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
                if(menuBtn) menuBtn.click();

                // allow time for the menu to show
                setTimeout(function() {
                  // continue to the next step
                  scope.tour.moveNext();
                }, scope.menuDelay);
              } else {
                // continue to the next step
                scope.tour.moveNext();
              }
            }
          }
        }
      );
    }
    
    // FOLLOWING ELEMENTS ARE DIFFERENT DEPENDING ON THE VIEW
    steps.push(
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet nde-record-actions nde-save-to-favorites' : '.search-result-item nde-record-actions nde-save-to-favorites',
        popover: {
          title: "Save to favourites",
          description: "You can save an item to your favourites to make it easier to find again.",
          side: "left",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the previous step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the previous step
              scope.tour.movePrevious();
            }
          }
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available export options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available export options"]',
        popover: {
          title: "Export",
          description: "These options allow you to export or share the item details.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Citation of"]' : '.search-result-item nde-record-actions button[aria-label^="Citation of"]',
        popover: {
          title: "View citation formats",
          description: "If you need to cite an item in your work, you can select its citation button to view its details in various standard reference formats.",
          side: "left",
          align: "start"
        }
      },
      {
        element: this.isSmallView || this.isMobileView ? 'nde-actions-bottom-sheet button[aria-label^="Click to get all available share options"]' : '.search-result-item nde-record-actions button[aria-label^="Click to get all available share options"]',
        popover: {
          title: "Sharing options",
          description: "Get a permalink (permanent link) for an item or view a QR code that you can scan to view the item's details.",
          side: "left",
          align: "start",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to close the menu so we can highlight the next element
              var menuBtn = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to close
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-full-display-navigation',
        popover: {
          title: "Go back",
          description: "Select this button to return to the browse results list.",
          side: "right",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isSmallView || scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.search-result-item button[data-qa="mobile-actions-btn"]') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.movePrevious();
            }
          },
        }
      },
      {
        element: 'nde-general-search-header > section',
        popover: {
          title: "Search form",
          description: "If you didn't get the results that you were after, try a new search.",
          side: "bottom",
          align: "center"
        }
      },
      {
        element: 'button.s-lch-widget-float-btn',
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your library search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // continue to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: scope.isMobileView ? '.show-more-main-menu-out-inner-wrapper-ul li:nth-child(2) button' : 'nde-report-a-problem',
        popover: {
          title: "Ran into an issue?",
          description: "If you have encountered a problem with a search, resource, or signing in, select 'Report a problem' to report it to the library.",
          side: "left",
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
              }, scope.menuDelay);
            } else {
              // go back to the previous step
              scope.tour.movePrevious();
            }
          },
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to close the menu so we can highlight the previous element
              var closeBtn = document.querySelector('nde-main-menu-dialog .close-btn') as HTMLElement;
              if(closeBtn) closeBtn.click();

              // allow time for the menu to hide
              setTimeout(function() {
                // go to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
            } else {
              // go to the next step
              scope.tour.moveNext();
            }
          }
        }
      },
      {
        element: 'nde-logo',
        popover: {
          title: "Library website",
          description: "To return to the Library website, select the La Trobe University logo.",
          side: "bottom",
          align: "start",
          onPrevClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the prev step
                scope.tour.movePrevious();
              }, scope.menuDelay);
            } else {
              // continue to the prev step
              scope.tour.movePrevious();
            }
          }
        }
      }
    );
    
    return steps;
  }

  private get collectionHomeSteps(): any[] {
    const scope = this; // capture the component scope for use in the onNextClick function
    
    return [
      /*{
        popover: {
          title: "Welcome to featured collections",
          description: "FEATURED_COLLECTIONS",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      },*/
      {
        element: "nde-collection-discovery-search-bar",
        popover: {
          title: "Search form",
          description: "Search within all the featured collections.",
          side: "left",
          align: "start",
          showButtons: ["next", "close"],
          popoverClass: 'ltu-tour ltu-tour-wide'
        }
      }, 
      {
        element: "nde-collection-discovery-gallery",
        popover: {
          title: "Collections",
          description: "Select a collection to browse the items within it.",
          side: "top",
          align: "center"
        }
      }, 
      {
        element: ".s-lch-widget-float-btn",
        popover: {
          title: "Need help?",
          description: "Use the chat feature to talk with a librarian, or use the 'Help' option in the main menu to access resources and information to help you with your Library collections search.",
          side: "left",
          align: "end",
          onNextClick: function(element: any, step: any, options: any): void {
            if(scope.isMobileView) {
              // we want to open the menu so we can highlight the next element
              var menuBtn = document.querySelector('.main-menu-mobile-btn') as HTMLElement;
              if(menuBtn) menuBtn.click();

              // allow time for the menu to show
              setTimeout(function() {
                // continue to the next step
                scope.tour.moveNext();
              }, scope.menuDelay);
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
          description: "If you have encountered a problem with a search, resource or signing in, select 'Report a problem' to report it to the library.",
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
              }, scope.menuDelay);
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
              }, scope.menuDelay); 
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
          description: "To return to the Library website, select the La Trobe University logo.",
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
              }, scope.menuDelay);
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
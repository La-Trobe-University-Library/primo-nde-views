import { AvailabilityCountComponent } from "../availability-count/availability-count.component";
import { BrowseHomePageContentComponent } from "../browse-home-page-content/browse-home-page-content.component";
import { CollectionAuthorDateComponent } from "../collection-author-date/collection-author-date.component";
//import { CredentialChangesComponent } from "../credential-changes/credential-changes.component";
import { DatabaseHomepageNoticeComponent } from "../database-homepage-notice/database-homepage-notice.component";
import { PrefilledAdvancedSearchComponent } from "../prefilled-advanced-search/prefilled-advanced-search.component";
import { RequestStatusComponent } from "../request-status/request-status.component";

// Define the map
export const selectorComponentMap = new Map<string, any>([

    //['nde-footer-before', LibchatComponent], // using LibChat add-on instead (styles copied to custom.css)
    ['nde-collection-discovery-gallery-item-bottom', CollectionAuthorDateComponent],
    ['nde-search-filters-side-nav-bottom', AvailabilityCountComponent],
    ['nde-database-home-page-bottom', DatabaseHomepageNoticeComponent],
    ['nde-browse-home-page-bottom', BrowseHomePageContentComponent],
    //['nde-personal-settings-bottom', CredentialChangesComponent],
    ['nde-account-section-results-bottom', RequestStatusComponent],
    ['nde-requests-overview-bottom', RequestStatusComponent],
    ['nde-advanced-search-bottom', PrefilledAdvancedSearchComponent],

]);

import { AvailabilityCountComponent } from "../availability-count/availability-count.component";
import { CollectionAuthorDateComponent } from "../collection-author-date/collection-author-date.component";
import { LibchatComponent } from "../libchat/libchat.component";

// Define the map
export const selectorComponentMap = new Map<string, any>([

    ['nde-footer-before', LibchatComponent],
    ['nde-collection-discovery-gallery-item-bottom', CollectionAuthorDateComponent],
    ['nde-search-filters-side-nav-bottom', AvailabilityCountComponent],

]);

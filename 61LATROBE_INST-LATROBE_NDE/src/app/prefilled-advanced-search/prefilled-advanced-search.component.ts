import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'custom-prefilled-advanced-search',
  standalone: true,
  imports: [],
  templateUrl: './prefilled-advanced-search.component.html',
  styleUrl: './prefilled-advanced-search.component.scss'
})
export class PrefilledAdvancedSearchComponent implements AfterViewInit {
  async ngAfterViewInit() {
    // get the URL parameters
    const params = new URLSearchParams(window.location.search);

    // if a material type is defined in the URL, pre-select it
    const materialType = params.get("custom_mtype");
    console.log("Material type: ", materialType);
    if(materialType) {
      const materialDropdown = document.querySelector('mat-select[data-qa="advanced-search-material-type"]') as HTMLElement;
      if(materialDropdown) {
        materialDropdown.click();

        setTimeout(() => {
          const option = Array.from(document.querySelectorAll('mat-option'))
            .find(o => o.textContent?.trim().toLowerCase() === materialType) as HTMLElement | undefined;

          if(option) {
            // select that option
            option.click();
          } else {
            // select the first option (i.e. 'All items') to close the drop-down
            const firstOption = document.querySelector('mat-option') as HTMLElement | undefined;
            firstOption?.click();
          }
        }, 0);
      }      
    }

    // if there is text in the simple search field, copy it to the Advanced search field (but only if no current advanced search)
    const simpleSearchField = document.querySelector('#main-search-bar') as HTMLInputElement;
    if(simpleSearchField) {
      const simpleSearchTerm = simpleSearchField.value;
      console.log('simpleSearchTerm: ',simpleSearchTerm);

      const advSearchField = document.querySelector('mat-form-field.search-field input') as HTMLInputElement;
      if(advSearchField) advSearchField.value = simpleSearchTerm;
    }
  }
}

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

@Component({
  selector: 'custom-credential-changes',
  standalone: true,
  //encapsulation: ViewEncapsulation.None,
  imports: [],
  templateUrl: './credential-changes.component.html',
  styleUrl: './credential-changes.component.scss'
})
export class CredentialChangesComponent implements OnInit {
  private SSOUserGroups = ['030', '031', '020', '025', '010'];

  constructor(
    private store: Store<any>
  ) { }

  ngOnInit(): void {

    // get the user group from the store
    this.store
      .select(state => state?.user?.decodedJwt?.userGroup)
      .pipe(take(1))
      .subscribe(userGroup => {
        const button = document.querySelector('nde-personal-settings button[data-qa="settings-update-login-btn"]');
        if(button) {
          // check if the user group is in the SSOUserGroups array        
          if(this.SSOUserGroups.includes(userGroup)) {
            // if it is, remove the button
            button.remove();
          } else {
            // if it is not SSO (i.e. Alma), add the 'allowed' class to the button (so it is shown via CSS in custom.css)
            button.classList.add('allowed');
          }
        }
      });
  }

}
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'custom-service-page-notice',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './service-page-notice.component.html',
  styleUrl: './service-page-notice.component.scss'
})
export class ServicePageNoticeComponent {
  private destroy$ = new Subject<void>();

  public isQuestionable: boolean = false;
  public questionableLabel: string = '';

  public isPossiblyLegitimate: boolean = false;
  public possiblyLegitimateLabel: string = '';

  constructor(
    private store: Store<any>,
    private translate: TranslateService
  ) {}

  ngAfterViewInit(): void {
    // check the PNX data to see if there's a sourcerecordid (i.e. a legit associated record was found)
    this.store
      .select(state => (Object.values(state?.Search?.entities ?? {})[0] as { pnx?: any })?.pnx?.control)
      .pipe(
        distinctUntilChanged()
      )
      .subscribe(control => {
        // get the record ID to see if the record data is present
        let recordid = control?.recordid;

        // get the source record ID to see if an associated real record was found
        let sourcerecordid = control?.sourcerecordid;
        
        //console.log('Control recordid: ',recordid);
        //console.log('Control sourcerecordid: ',sourcerecordid);

        if(recordid && !sourcerecordid) {
          // record data is there but no associated source record was found, so this may not be a legit record

          this.questionableLabel = this.translate.instant('nui.record.questionable');

          this.isQuestionable = true;
        } else if(recordid) {
          // record data is there and an associated source record was found

          // get the label for the "possibly legitimate" notice
          this.possiblyLegitimateLabel = this.translate.instant('nui.record.possibly_legitimate');

          // get the referrer to see where the user came from
          let referrer = document.referrer;
          console.log('Referrer:', referrer);
          if (referrer) {
            try {
              const referrerUrl = new URL(referrer);
              //console.log('Referrer host:', referrerUrl.hostname);
              
              // get a comma-seprated list of whitelisted hosts from a label
              let whitelistKey = 'nui.record.legitimate_whitelist';
              let whitelistedHosts = this.translate.instant(whitelistKey);
              if(!whitelistedHosts || whitelistedHosts === whitelistKey) whitelistedHosts = '';

              // get whitelisted hosts in an array
              let whitelistedHostnames = whitelistedHosts
                .split(',')
                .map((host: string) => host.trim().toLowerCase())
                .filter((host: string) => host.length > 0);
              //console.log('Whitelisted hosts:', whitelistedHostnames);

              if (!whitelistedHostnames.includes(referrerUrl.hostname.toLowerCase())) {
                // user arrived from an un-whitelisted source - show the "possibly legitimate" notice
                this.isPossiblyLegitimate = true;
              }
            } catch {
              // invalid/unexpected referrer - show the "possibly legitimate" notice
              this.isPossiblyLegitimate = true;
            }
          } else {
            // no referrer - show the "possibly legitimate" notice
            this.isPossiblyLegitimate = true;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

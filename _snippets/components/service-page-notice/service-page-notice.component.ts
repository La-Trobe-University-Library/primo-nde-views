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

  private unmatchedCode = 'nui.record.unmatched';
  public isUnmatched: boolean = false;
  public unmatchedLabel: string = '';

  private questionableCode = 'nui.record.questionable';
  public isQuestionable: boolean = false;
  public questionableLabel: string = '';

  private whitelistCode = 'nui.record.legitimate_whitelist';

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
        
        if(recordid && !sourcerecordid) {
          // record data is there but no associated source record was found, so this may not be a legit record

          this.unmatchedLabel = this.translate.instant(this.unmatchedCode);

          // don't show the unmatched notice if the label is missing or only 1 character long (e.g. '-')
          if(!this.unmatchedLabel || this.unmatchedLabel === this.unmatchedCode || this.unmatchedLabel.length <= 1) return;

          this.isUnmatched = true;
        } else if(recordid) {
          // record data is there and an associated source record was found

          // get the label for the questionable notice
          this.questionableLabel = this.translate.instant(this.questionableCode);

          // don't show the questionable notice if the label is missing or only 1 character long (e.g. '-')
          if(!this.questionableLabel || this.questionableLabel === this.questionableCode || this.questionableLabel.length <= 1) return;

          // get the referrer to see where the user came from
          let referrer = document.referrer;
          if (referrer) {
            try {
              const referrerUrl = new URL(referrer);
              
              // get a comma-seprated list of whitelisted hosts from a label
              let whitelistedHosts = this.translate.instant(this.whitelistCode);
              if(!whitelistedHosts || whitelistedHosts === this.whitelistCode) whitelistedHosts = '';

              // get whitelisted hosts in an array
              let whitelistedHostnames = whitelistedHosts
                .split(',')
                .map((host: string) => host.trim().toLowerCase())
                .filter((host: string) => host.length > 0);
              
              // check if the referrer hostname is in the whitelist
              if (!whitelistedHostnames.includes(referrerUrl.hostname.toLowerCase())) {
                // user arrived from an un-whitelisted source - show the questionable notice
                this.isQuestionable = true;
              }
            } catch {
              // invalid/unexpected referrer - show the questionable notice
              this.isQuestionable = true;
            }
          } else {
            // no referrer - show the questionable notice
            this.isQuestionable = true;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'custom-custom-notice',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  templateUrl: './custom-notice.component.html',
  styleUrl: './custom-notice.component.scss'
})
export class CustomNoticeComponent {
  public isEnabled: boolean = false;
  public noticeType: string;
  public noticeIcon: string;

  constructor(private translate: TranslateService) {
    // get the type of notice from a label
    const typeCode = 'nui.customnotice.type';
    const typeLabel = this.translate.instant(typeCode) as string;
    this.noticeType =
      typeof typeLabel === 'string' &&
      typeLabel.trim() !== '' &&
      typeLabel !== typeCode
        ? typeLabel
        : 'warning';

    // get the icon of notice from a label
    const iconCode = 'nui.customnotice.icon';
    const iconLabel = this.translate.instant(iconCode) as string;
    this.noticeIcon =
      typeof iconLabel === 'string' &&
      iconLabel.trim() !== '' &&
      iconLabel !== iconCode
        ? iconLabel
        : 'info_outline';

    // check whether the notice is enabled
    const enabledCode = 'nui.customnotice.enabled';
    const enabledLabel = this.translate.instant(enabledCode) as string;
    if (typeof enabledLabel === 'string' && enabledLabel.trim() !== '' && enabledLabel !== enabledCode) {
      this.isEnabled = enabledLabel === 'true';
    }
  }
}
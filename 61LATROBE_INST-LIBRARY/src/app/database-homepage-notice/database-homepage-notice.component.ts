import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'custom-database-homepage-notice',
  standalone: true,
  encapsulation: ViewEncapsulation.None, 
  imports: [TranslateModule],
  templateUrl: './database-homepage-notice.component.html',
  styleUrl: './database-homepage-notice.component.scss'
})
export class DatabaseHomepageNoticeComponent {

}

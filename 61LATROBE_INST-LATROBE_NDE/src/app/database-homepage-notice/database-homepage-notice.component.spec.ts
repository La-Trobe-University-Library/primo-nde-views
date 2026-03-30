import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatabaseHomepageNoticeComponent } from './database-homepage-notice.component';

describe('DatabaseHomepageNoticeComponent', () => {
  let component: DatabaseHomepageNoticeComponent;
  let fixture: ComponentFixture<DatabaseHomepageNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatabaseHomepageNoticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatabaseHomepageNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

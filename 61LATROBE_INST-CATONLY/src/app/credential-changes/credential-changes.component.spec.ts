import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialChangesComponent } from './credential-changes.component';

describe('CredentialChangesComponent', () => {
  let component: CredentialChangesComponent;
  let fixture: ComponentFixture<CredentialChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialChangesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CredentialChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

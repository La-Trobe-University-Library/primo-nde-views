import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibchatComponent } from './libchat.component';

describe('LibchatComponent', () => {
  let component: LibchatComponent;
  let fixture: ComponentFixture<LibchatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibchatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibchatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

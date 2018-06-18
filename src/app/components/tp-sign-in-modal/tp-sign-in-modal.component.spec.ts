import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpSignInModalComponent } from './tp-sign-in-modal.component';

describe('TpSignInModalComponent', () => {
  let component: TpSignInModalComponent;
  let fixture: ComponentFixture<TpSignInModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpSignInModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpSignInModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpSwitchComponent } from './tp-switch.component';

describe('TpSwitchComponent', () => {
  let component: TpSwitchComponent;
  let fixture: ComponentFixture<TpSwitchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpSwitchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

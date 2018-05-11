import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpHeaderComponent } from './tp-header.component';

describe('TpHeaderComponent', () => {
  let component: TpHeaderComponent;
  let fixture: ComponentFixture<TpHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

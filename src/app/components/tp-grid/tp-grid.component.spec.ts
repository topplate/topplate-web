import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpGridComponent } from './tp-grid.component';

describe('TpGridComponent', () => {
  let component: TpGridComponent;
  let fixture: ComponentFixture<TpGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

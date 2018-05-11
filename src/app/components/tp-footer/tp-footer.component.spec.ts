import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpFooterComponent } from './tp-footer.component';

describe('TpFooterComponent', () => {
  let component: TpFooterComponent;
  let fixture: ComponentFixture<TpFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

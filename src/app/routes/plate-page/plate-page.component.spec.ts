import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatePageComponent } from './plate-page.component';

describe('PlatePageComponent', () => {
  let component: PlatePageComponent;
  let fixture: ComponentFixture<PlatePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlatePageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

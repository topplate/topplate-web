import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatePreviewComponent } from './plate-preview.component';

describe('PlatePreviewComponent', () => {
  let component: PlatePreviewComponent;
  let fixture: ComponentFixture<PlatePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlatePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

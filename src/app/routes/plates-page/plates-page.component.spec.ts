import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatesPageComponent } from './plates-page.component';

describe('PlatesPageComponent', () => {
  let component: PlatesPageComponent;
  let fixture: ComponentFixture<PlatesPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlatesPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

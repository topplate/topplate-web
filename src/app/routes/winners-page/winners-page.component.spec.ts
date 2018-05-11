import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WinnersPageComponent } from './winners-page.component';

describe('WinnersPageComponent', () => {
  let component: WinnersPageComponent;
  let fixture: ComponentFixture<WinnersPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WinnersPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WinnersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

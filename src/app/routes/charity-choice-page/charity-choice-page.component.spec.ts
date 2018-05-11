import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CharityChoicePageComponent } from './charity-choice-page.component';

describe('CharityChoicePageComponent', () => {
  let component: CharityChoicePageComponent;
  let fixture: ComponentFixture<CharityChoicePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CharityChoicePageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CharityChoicePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

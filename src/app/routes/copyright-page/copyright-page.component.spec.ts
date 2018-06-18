import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyrightPageComponent } from './copyright-page.component';

describe('CopyrightPageComponent', () => {
  let component: CopyrightPageComponent;
  let fixture: ComponentFixture<CopyrightPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyrightPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyrightPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TpCollectionComponent } from './tp-collection.component';

describe('TpCollectionComponent', () => {
  let component: TpCollectionComponent;
  let fixture: ComponentFixture<TpCollectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TpCollectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TpCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

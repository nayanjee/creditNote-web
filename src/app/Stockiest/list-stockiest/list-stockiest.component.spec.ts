import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListStockiestComponent } from './list-stockiest.component';

describe('ListStockiestComponent', () => {
  let component: ListStockiestComponent;
  let fixture: ComponentFixture<ListStockiestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListStockiestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListStockiestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

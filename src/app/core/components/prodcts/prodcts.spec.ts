import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prodcts } from './prodcts';

describe('Prodcts', () => {
  let component: Prodcts;
  let fixture: ComponentFixture<Prodcts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prodcts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Prodcts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

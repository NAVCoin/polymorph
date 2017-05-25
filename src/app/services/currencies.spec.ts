import { TestBed, inject } from '@angular/core/testing';

import { CurrenciesService } from './currencies';

describe('CurrenciesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrenciesService]
    });
  });

  it('should be created', inject([CurrenciesService], (service: CurrenciesService) => {
    expect(service).toBeTruthy();
  }));
});

import { TestBed } from '@angular/core/testing';

import { RestClient } from './rest-client';

describe('RestClient', () => {
  let service: RestClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DataRelService } from './data-rel.service';

describe('DataRelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataRelService]
    });
  });

  it('should ...', inject([DataRelService], (service: DataRelService) => {
    expect(service).toBeTruthy();
  }));
});

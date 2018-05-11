import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bigNumber'
})
export class BigNumberPipe implements PipeTransform {
  transform (value: string, decimalsLen: number) {

    let
      res = '',
      val = parseFloat(value),
      str = val.toFixed(0),
      digits = {
        'K' : 1000,
        'M' : 1000000,
        'B' : 1000000000,
        'T' : 1000000000000,
        'Q' : 1000000000000000
      },
      minVal = digits.K;

    if (typeof val !== 'number') return 'NaN';
    if (val < minVal) return str;

    for (let i = 0, len = Object.keys(digits).length; i < len; i++) {

      let
        currDigit = Object.keys(digits)[i],
        currValue = digits[currDigit];

      if (val / currValue < 1) break;
      else res = (val / currValue).toFixed(decimalsLen || 1) + currDigit;
    }

    return res;
  }
}

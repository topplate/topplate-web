import { Pipe, PipeTransform } from '@angular/core';
import { AppD3Service } from '../services/d3.service';

const d3 = AppD3Service.getD3();

@Pipe({
  name: 'splittedString'
})
export class SplittedStringPipe implements PipeTransform {
  transform (value: string, numberOfRows: number) {

    let
      words = value.split(' '),
      rows = [],
      n = numberOfRows || 2;

    d3.range(n).forEach(i => {
      let isLastRow = (i + 1) === n;
      if (isLastRow) rows.push(words.join(' '));
      else rows.push(words.splice(0, 1)[0] || '');
    });

    return rows;
  }
}

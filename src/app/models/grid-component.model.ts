export class GridComponentModel {

  public events: any;

  public cols: any[] = [];

  public rows: any[] = [];

  public clearRows () {
    this.rows.length = 0;
  }

  public addRows (rows = []) {
    let cols = this.cols;
    rows.forEach(row => {
      let cells = [];
      cols.forEach(col => {
        let
          datum = row[col.name],
          type = col.type,
          cell = {
            type: type,
            value: null,
            getColumn: () => col,
            getRow: () => row
          };

        if (type === 'string') cell.value = datum;
        else if (type === 'list') cell.value = Array.isArray(datum) ? datum : [datum];

        cells.push(cell);
      });

      this.rows.push({
        data: row,
        cells: cells
      });
    });
  }

  public refreshRows (rows = []) {
    this.clearRows();
    this.addRows(rows);
  }

  public emitEvent (eventName, eventData) {
    let event = this.events[eventName];
    return typeof event === 'function' && event(eventData);
  }

  constructor (cols, events) {
    cols.forEach((col, i) => this.cols.push({
      index: col.index,
      name: col.name,
      label: col.label || col.name,
      type: col.type || 'string'
    }));

    this.events = (typeof events === 'object' && events) || {};
  }
}

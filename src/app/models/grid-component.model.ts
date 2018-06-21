export class GridComponentModel {

  public events: any;

  public cols: any[] = [];

  public rows: any[] = [];

  private static getNewRow (row, cols) {
    let newRow = {
      _id: row._id,
      data: row,
      cells: []
    };

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

      if (type === 'string' || type === 'number') cell.value = datum;
      else if (type === 'list') cell.value = Array.isArray(datum) ? datum : [datum];
      else if (type === 'object') cell.value = col['keys'].map(key => (datum || {})[key]);
      else if (type === 'boolean') cell.value = !!datum;

      newRow.cells.push(cell);
    });

    return newRow;
  }

  public clearRows () {
    this.rows.length = 0;
  }

  public addRows (rows = []) {
    (Array.isArray(rows) ? rows : [rows]).forEach(row => this.rows.push(GridComponentModel.getNewRow(row, this.cols)));
  }

  public refreshRows (rows = []) {
    this.clearRows();
    this.addRows(rows);
  }

  public refreshRow (rowData) {
    let indexOfRowToReplace = this.rows.indexOf(this.rows.filter(row => row._id === rowData._id)[0]);
    if (indexOfRowToReplace > -1) this.rows[indexOfRowToReplace] = GridComponentModel.getNewRow(rowData, this.cols);
  }

  public removeRow (rowData) {
    let indexOfRowToReplace = this.rows.indexOf(this.rows.filter(row => row._id === rowData._id)[0]);
    if (indexOfRowToReplace > -1) this.rows.splice(indexOfRowToReplace, 1);
  }

  public toggleColumn (clickedCol) {
    if (!clickedCol.isSortable) return;
    if (clickedCol.isSelected) clickedCol.isReversed = !clickedCol.isReversed;
    else this.cols.forEach(col => col.isSelected = col.index === clickedCol.index);
  }

  public emitEvent (eventName, eventData) {
    let event = this.events[eventName];
    return typeof event === 'function' && event(eventData);
  }

  public getSelectedColumn () {
    let selectedColumn = this.cols.filter(col => col.isSelected)[0];

    return selectedColumn ? {
      name: selectedColumn.name,
      type: selectedColumn.type,
      isReversed: selectedColumn.isReversed,
      isSelected: selectedColumn.isSelected
    } : null;
  }

  constructor (cols, events) {
    cols.forEach((col, i) => this.cols.push({
      index: col.index || i,
      name: col.name,
      label: col.label || col.name,
      type: col.type || 'string',
      keys: col.keys || [],
      isSelected: false,
      isReversed: false,
      isSortable: col.sortable || false
    }));

    this.events = (typeof events === 'object' && events) || {};
  }
}

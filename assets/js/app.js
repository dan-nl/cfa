'use strict';

/**
 * module variables
 */
var ajax;
var arrayObjectSort;
var column_headings;
var Papa;
var processed_rows;
var table;
var tbody;

/**
 * module dependencies
 */
ajax = require( 'node-ajax' );
arrayObjectSort = require( 'node-array-object-sort' );
Papa = require( 'papaparse' );

/**
 * @param rows
 * @returns {string}
 */
function getTbody( rows ) {
  var i;
  var row;
  var tbody;

  tbody = '<tbody>';

  for ( i = 0; i < rows.length; i += 1 ) {
    row = rows[ i ];
    tbody += '<tr>';
    tbody += '<td>' + row.violation_category + '</td>';
    tbody += '<td>' + row.open + '</td>';
    tbody += '<td>' + row.closed + '</td>';
    tbody += '<td>' + row.total + '</td>';
    tbody += '<td>' + row.most_recent_violation_date + '</td>';
    tbody += '</tr>';
  }

  tbody += '</tbody>';

  return tbody;
}

function setupTable() {
  var html;

  html = '<thead>';
  html += '<tr>';
  html += '<th data-index="violation_category" data-sort-order="asc">violation category</th>';
  html += '<th data-index="open" data-sort-order="asc">open</th>';
  html += '<th data-index="closed" data-sort-order="asc">closed</th>';
  html += '<th data-index="total" data-sort-order="asc">total</th>';
  html += '<th data-index="most_recent_violation_date" data-sort-order="asc">most recent violation</th>';
  html += '</tr>';
  html += '</thead>';

  html += '<tbody></tbody>';

  return html;
}

/**
 * compares the row.most_recent_violation_date with the data_item.violation_date and
 * returns the date that is more recent
 *
 * @param {Object} data_item
 * @param {string} data_item.violation_date
 *
 * @param {Object} row
 * @param {string} row.most_recent_violation_date
 *
 * @returns {string}
 */
function getMostRecentDate( data_item, row ) {
  var d1;
  var d2;
  var data_item_date;
  var row_date;

  data_item_date = data_item.violation_date.replace( /\s/, 'T' );
  row_date = row.most_recent_violation_date.replace( /\s/, 'T' );

  d1 = new Date( data_item_date );
  d2 = new Date( row_date );

  if ( d1 > d2 ) {
    return data_item.violation_date;
  }

  return row.most_recent_violation_date;
}

/**
 * @param {string} violation_category
 * @returns {Object}
 */
function addNewDataRow( violation_category ) {
  return {
    closed: 0,
    most_recent_violation_date: '1970-01-01 00:00:00',
    open: 0,
    total: 0,
    violation_category: violation_category
  };
}

/**
 * @param {Object} data_item
 * @param {Array} rows
 * @returns {number}
 */
function getRowIndex( data_item, rows ) {
  var i;
  var row_index;

  for ( i = 0; i < rows.length; i += 1 ) {
    if ( rows[ i ].violation_category === data_item.violation_category ) {
      row_index = i;
      break;
    }
  }

  if ( typeof row_index !== 'number' ) {
    rows.push( addNewDataRow( data_item.violation_category ) );
    row_index = rows.length - 1;
  }

  return row_index;
}

/**
 * @param {Object} data_item
 * @param {string} data_item.violation_date
 * @param {string} data_item.violation_date_closed
 *
 * @param {Array} rows
 *
 * @returns {Array}
 */
function addDataItemToRows( data_item, rows ) {
  var row_index;

  row_index = getRowIndex( data_item, rows );

  // add to totals
  if ( data_item.violation_date_closed === '' ) {
    rows[ row_index ].open += 1;
  } else {
    rows[ row_index ].closed += 1;
  }

  rows[ row_index ].total += 1;

  // determine last violation date
  rows[ row_index ].most_recent_violation_date = getMostRecentDate(
    data_item,
    rows[ row_index ]
  );

  return rows;
}

/**
 * @param {Object} parsed_response
 * @returns {Array}
 */
function processParsedResponse( parsed_response ) {
  var i;
  var data_items;
  var rows;

  data_items = parsed_response.data;
  rows = [];

  for ( i = 0; i < data_items.length; i += 1 ) {
    rows = addDataItemToRows( data_items[ i ], rows );
  }

  return rows;
}

/**
 * @param {HTMLElement} col_heading
 * @param {string} data_sort_order
 */
function toggleColumnHeadingSortOrder( col_heading, data_sort_order ) {
  if ( data_sort_order === 'asc' ) {
    col_heading.setAttribute( 'data-sort-order', 'dsc' );
  } else {
    col_heading.setAttribute( 'data-sort-order', 'asc' );
  }
}

function handleColumnHeadingClick() {
  /* jshint validthis:true */
  var data_index;
  var data_sort_order;
  var elm;

  elm = this;
  data_index = elm.getAttribute( 'data-index' );
  data_sort_order = elm.getAttribute( 'data-sort-order' );

  processed_rows = arrayObjectSort( processed_rows, data_index, data_sort_order );
  tbody.innerHTML = getTbody( processed_rows );

  toggleColumnHeadingSortOrder( elm, data_sort_order );
  addColumnHeadingListeners();
}

function addColumnHeadingListeners() {
  var i;

  for ( i = 0; i < column_headings.length; i += 1 ) {
    column_headings[ i ].addEventListener( 'click', handleColumnHeadingClick );
  }
}

module.exports = function init() {
  var parsed_response;
  var response;

  table = document.getElementsByTagName( 'table' )[ 0 ];

  if ( !table ) {
    return;
  }

  ajax.get( '/csv/violations-2012.csv' )
    .then(
      function ( xhr ) {
        response = ajax.getXhrResponse( xhr );
        parsed_response = Papa.parse( response, { dynamicTyping: true, header: true } );
        processed_rows = processParsedResponse( parsed_response );

        table.innerHTML = setupTable();
        column_headings = table.getElementsByTagName( 'th' );
        tbody = table.getElementsByTagName( 'tbody' )[ 0 ];
        tbody.innerHTML = getTbody( processed_rows );

        addColumnHeadingListeners( table );
      }
    )
    .catch(
      /**
       * @param {Error} err
       */
      function ( err ) {
        console.log( err );
      }
    );
}();

'use strict';

/**
 * module variables
 */
var ajax;
var Papa;

/**
 * module dependencies
 */
ajax = require( 'node-ajax' );
Papa = require( 'papaparse' );

/**
 * @param {Object} processed_data
 * @returns {string}
 */
function getTbody( processed_data ) {
  var categories;
  var category;
  var i;
  var tbody;

  categories = Object.keys( processed_data );

  tbody = '<tbody>';

  for ( i = 0; i < categories.length; i += 1 ) {
    category = categories[ i ];
    tbody += '<tr>';
    tbody += '<td>' + category + '</td>';
    tbody += '<td>' + processed_data[ category ].open + '</td>';
    tbody += '<td>' + processed_data[ category ].closed + '</td>';
    tbody += '<td>' + processed_data[ category ].total + '</td>';
    tbody += '<td>' + processed_data[ category ].last_date + '</td>';
    tbody += '</tr>';
  }

  tbody += '</tbody>';

  return tbody;
}

function getThead() {
  var thead;

  thead = '<thead>';
  thead += '<tr>';
  thead += '<th>category</th>';
  thead += '<th>open</th>';
  thead += '<th>closed</th>';
  thead += '<th>total</th>';
  thead += '<th>last date</th>';
  thead += '</tr>';
  thead += '</thead>';

  return thead;
}

/**
 * @param {Object} processed_data
 * @returns {string|*}
 */
function getTableHtml( processed_data ) {
  var html;

  html = '';
  html += getThead();
  html += getTbody( processed_data );

  return html;
}

/**
 * @param {Object} processed_item
 * @param {Object} item
 * @param {string} item.violation_date
 * @returns {*}
 */
function getLastDate( processed_item, item ) {
  var d1;
  var d2;
  var item_date;
  var processed_item_date;

  item_date = item.violation_date.replace( /\s/, 'T' );
  processed_item_date = processed_item.last_date.replace( /\s/, 'T' );

  d2 = new Date( item_date );
  d1 = new Date( processed_item_date );

  if ( d2 > d1 ) {
    return item.violation_date;
  }

  return processed_item.last_date;
}

/**
 * @param {Object} parsed_response
 * @returns {{}|*}
 */
function processParsedResponse( parsed_response ) {
  var data;
  var i;

  /**
   * @typedef {Object} item
   * @typedef {string} item.violation_category
   * @typedef {string} item.violation_date_closed
   */
  var item;
  var processed_data;

  data = parsed_response.data;
  processed_data = {};

  for ( i = 0; i < data.length; i += 1 ) {
    item = data[ i ];

    // setup initial category entry
    if ( !processed_data[ item.violation_category ] ) {
      processed_data[ item.violation_category ] = {};
      processed_data[ item.violation_category ].open = 0;
      processed_data[ item.violation_category ].closed = 0;
      processed_data[ item.violation_category ].total = 0;
      processed_data[ item.violation_category ].last_date = '1970-01-01 00:00:00';
    }

    // add to totals
    if ( item.violation_date_closed === '' ) {
      processed_data[ item.violation_category ].open += 1;
    } else {
      processed_data[ item.violation_category ].closed += 1;
    }

    processed_data[ item.violation_category ].total += 1;

    // determine last violation date
    processed_data[ item.violation_category ].last_date = getLastDate(
      processed_data[ item.violation_category ],
      item
    );
  }

  return processed_data;
}

module.exports = function init() {
  var parsed_response;
  var response;
  var table;

  table = document.getElementsByTagName( 'table' )[ 0 ];

  if ( !table ) {
    return;
  }

  ajax.get( '/csv/violations-2012.csv' )
    .then(
      function ( xhr ) {
        response = ajax.getXhrResponse( xhr );
        parsed_response = Papa.parse( response, { dynamicTyping: true, header: true } );
        table.innerHTML = getTableHtml( processParsedResponse( parsed_response ) );
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

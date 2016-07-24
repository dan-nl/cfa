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
    tbody += '<td>' + processed_data[ category ].most_recent_violation_date + '</td>';
    tbody += '</tr>';
  }

  tbody += '</tbody>';

  return tbody;
}

function getThead() {
  var thead;

  thead = '<thead>';
  thead += '<tr>';
  thead += '<th>violation category</th>';
  thead += '<th>open</th>';
  thead += '<th>closed</th>';
  thead += '<th>total</th>';
  thead += '<th>most recent violation</th>';
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
 * compares the processed_item.most_recent_violation_date with the current_item.violation_date and
 * returns the date that is more recent
 *
 * @param {Object} processed_item
 * @param {String} processed_item.most_recent_violation_date
 *
 * @param {Object} current_item
 * @param {String} current_item.violation_date
 * @returns {*}
 */
function getMostRecentDate( processed_item, current_item ) {
  var d1;
  var d2;
  var item_date;
  var processed_item_date;

  item_date = current_item.violation_date.replace( /\s/, 'T' );
  processed_item_date = processed_item.most_recent_violation_date.replace( /\s/, 'T' );

  d2 = new Date( item_date );
  d1 = new Date( processed_item_date );

  if ( d2 > d1 ) {
    return current_item.violation_date;
  }

  return processed_item.most_recent_violation_date;
}

function getNewProcessedDataItem() {
  return {
    open: 0,
    closed: 0,
    total: 0,
    most_recent_violation_date: '1970-01-01 00:00:00'
  };
}

/**
 * @param {Object} parsed_response
 * @returns {{}|*}
 */
function processParsedResponse( parsed_response ) {
  /**
   * @typedef {Object} current_item
   * @typedef {string} current_item.violation_category
   * @typedef {string} current_item.violation_date_closed
   */
  var current_item;

  var i;
  var items;
  var processed_data;

  items = parsed_response.data;
  processed_data = {};

  for ( i = 0; i < items.length; i += 1 ) {
    current_item = items[ i ];

    // setup initial category entry
    if ( !( processed_data[ current_item.violation_category ] instanceof Object ) ) {
      processed_data[ current_item.violation_category ] = getNewProcessedDataItem();
    }

    // add to totals
    if ( current_item.violation_date_closed === '' ) {
      processed_data[ current_item.violation_category ].open += 1;
    } else {
      processed_data[ current_item.violation_category ].closed += 1;
    }

    processed_data[ current_item.violation_category ].total += 1;

    // determine last violation date
    processed_data[ current_item.violation_category ].most_recent_violation_date = getMostRecentDate(
      processed_data[ current_item.violation_category ],
      current_item
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

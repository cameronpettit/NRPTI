let _ = require('lodash');
let qs = require('qs');
let queryActions = require('../utils/queryActions');
let queryUtils = require('../utils/queryUtils');

let defaultLog = require('../utils/logger')('record');

let allowedFields = ['_createdBy', 'createdDate', 'description', 'publishDate', 'type'];

// Authenticated Requests

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 */
exports.protectedOptions = function(args, res, next) {
  res.status(200).send();
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.protectedHead = function(args, res, next) {
  defaultLog.info(
    'args.swagger.operation.x-security-scopes:',
    JSON.stringify(args.swagger.operation['x-security-scopes'])
  );

  // Build match query if on recordId route
  let query = {};

  // Add in the default fields to the projection so that the incoming query will work for any selected fields.
  allowedFields.push('_id');
  allowedFields.push('tags');

  if (args.swagger.params.recordId) {
    query = queryUtils.buildQuery('_id', args.swagger.params.recordId.value, query);
  } else {
    try {
      query = addStandardQueryFilters(query, args);
    } catch (error) {
      return queryActions.sendResponse(res, 400, { error: error.message });
    }
  }

  // Unless they specifically ask for it, hide deleted results.
  if (args.swagger.params.isDeleted && args.swagger.params.isDeleted.value !== undefined) {
    _.assignIn(query, { isDeleted: args.swagger.params.isDeleted.value });
  } else {
    _.assignIn(query, { isDeleted: false });
  }

  queryUtils
    .runDataQuery(
      'Record',
      args.swagger.operation['x-security-scopes'],
      query,
      allowedFields, // Fields
      null, // sort warmup
      null, // sort
      null, // skip
      1000000, // limit
      true
    ) // count
    .then(function(data) {
      if (!(args.swagger.params.recordId && args.swagger.params.recordId.value) || (data && data.length > 0)) {
        res.setHeader('x-total-count', data && data.length > 0 ? data[0].total_items : 0);
        return queryActions.sendResponse(res, 200, data);
      } else {
        return queryActions.sendResponse(res, 404, data);
      }
    })
    .catch(function(err) {
      defaultLog.error('record protectedHead runDataQuery:', err);
      return queryActions.sendResponse(res, 400, err);
    });
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.protectedGet = function(args, res, next) {
  let query = {};
  let sort = {};
  let skip = null;
  let limit = null;

  defaultLog.info(
    'args.swagger.operation.x-security-scopes:',
    JSON.stringify(args.swagger.operation['x-security-scopes'])
  );

  // Build match query if on recordId route
  if (args.swagger.params.recordId) {
    query = queryUtils.buildQuery('_id', args.swagger.params.recordId.value, query);
  } else {
    // Could be a bunch of results - enable pagination
    let processedParameters = queryUtils.getSkipLimitParameters(
      args.swagger.params.pageSize,
      args.swagger.params.pageNum
    );
    skip = processedParameters.skip;
    limit = processedParameters.limit;

    if (args.swagger.params.sortBy && args.swagger.params.sortBy.value) {
      let order_by = args.swagger.params.sortBy.value.charAt(0) == '-' ? -1 : 1;
      let sort_by = args.swagger.params.sortBy.value.slice(1);
      sort[sort_by] = order_by;
    }

    try {
      query = addStandardQueryFilters(query, args);
    } catch (error) {
      defaultLog.error('record protectedGet:', error);
      return queryActions.sendResponse(res, 400, { error: error.message });
    }
  }

  // Unless they specifically ask for it, hide deleted results.
  if (args.swagger.params.isDeleted && args.swagger.params.isDeleted.value !== undefined) {
    _.assignIn(query, { isDeleted: args.swagger.params.isDeleted.value });
  } else {
    _.assignIn(query, { isDeleted: false });
  }

  queryUtils
    .runDataQuery(
      'Record',
      args.swagger.operation['x-security-scopes'],
      query,
      queryUtils.getSanitizedFields(allowedFields, args.swagger.params.fields.value), // Fields
      null, // sort warmup
      sort, // sort
      skip, // skip
      limit, // limit
      false
    ) // count
    .then(function(data) {
      return queryActions.sendResponse(res, 200, data);
    })
    .catch(function(err) {
      defaultLog.error('record protectedGet runDataQuery:', err);
      return queryActions.sendResponse(res, 400, err);
    });
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 */
exports.protectedPost = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 */
exports.protectedPut = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 */
exports.protectedDelete = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 */
exports.protectedPublish = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

/**
 *TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 */
exports.protectedUnPublish = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

// Public Requests

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.publicHead = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

/**
 * TODO: populate this documentation
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @returns
 */
exports.publicGet = function(args, res, next) {
  return queryActions.sendResponse(res, 501);
};

/* eslint-disable no-redeclare */
/**
 * TODO: populate this documentation
 *
 * @param {*} query
 * @param {*} args
 * @returns
 */
let addStandardQueryFilters = function(query, args) {
  if (args.swagger.params.publishDate && args.swagger.params.publishDate.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.publishDate.value);
    if (queryString.since && queryString.until) {
      // Combine queries as logical AND for the dataset.
      _.assignIn(query, {
        $and: [
          {
            publishDate: { $gte: new Date(queryString.since) }
          },
          {
            publishDate: { $lte: new Date(queryString.until) }
          }
        ]
      });
    } else if (queryString.eq) {
      _.assignIn(query, {
        publishDate: { $eq: new Date(queryString.eq) }
      });
    } else {
      // Which param was set?
      if (queryString.since) {
        _.assignIn(query, {
          publishDate: { $gte: new Date(queryString.since) }
        });
      }
      if (queryString.until) {
        _.assignIn(query, {
          publishDate: { $lte: new Date(queryString.until) }
        });
      }
    }
  }
  if (args.swagger.params.cl_file && args.swagger.params.cl_file.value !== undefined) {
    _.assignIn(query, { cl_file: args.swagger.params.cl_file.value });
  }
  if (args.swagger.params.purpose && args.swagger.params.purpose.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.purpose.value);
    let queryArray = [];
    if (Array.isArray(queryString.eq)) {
      queryArray = queryString.eq;
    } else {
      queryArray.push(queryString.eq);
    }
    _.assignIn(query, { purpose: { $in: queryArray } });
  }
  if (args.swagger.params.subpurpose && args.swagger.params.subpurpose.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.subpurpose.value);
    let queryArray = [];
    if (Array.isArray(queryString.eq)) {
      queryArray = queryString.eq;
    } else {
      queryArray.push(queryString.eq);
    }
    _.assignIn(query, { subpurpose: { $in: queryArray } });
  }
  if (args.swagger.params.type && args.swagger.params.type.value !== undefined) {
    _.assignIn(query, { type: args.swagger.params.type.value });
  }
  if (args.swagger.params.subtype && args.swagger.params.subtype.value !== undefined) {
    _.assignIn(query, { subtype: args.swagger.params.subtype.value });
  }
  if (args.swagger.params.status && args.swagger.params.status.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.status.value);
    let queryArray = [];
    if (Array.isArray(queryString.eq)) {
      queryArray = queryString.eq;
    } else {
      queryArray.push(queryString.eq);
    }
    _.assignIn(query, { status: { $in: queryArray } });
  }
  if (args.swagger.params.reason && args.swagger.params.reason.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.reason.value);
    let queryArray = [];
    if (queryString.eq) {
      if (Array.isArray(queryString.eq)) {
        queryArray = queryString.eq;
      } else {
        queryArray.push(queryString.eq);
      }
      _.assignIn(query, { reason: { $in: queryArray } });
    } else if (queryString.ne) {
      if (Array.isArray(queryString.ne)) {
        queryArray = queryString.ne;
      } else {
        queryArray.push(queryString.ne);
      }
      _.assignIn(query, { reason: { $nin: queryArray } });
    }
  }
  if (args.swagger.params.agency && args.swagger.params.agency.value !== undefined) {
    _.assignIn(query, { agency: args.swagger.params.agency.value });
  }
  if (args.swagger.params.businessUnit && args.swagger.params.businessUnit.value !== undefined) {
    _.assignIn(query, { businessUnit: { $eq: args.swagger.params.businessUnit.value.eq } });
  }
  if (args.swagger.params.client && args.swagger.params.client.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.client.value);
    if (queryString.text) {
      // This searches for text indexed fields, which client is currently marked as in the record model.
      // If more fields are added to the text index, this logic may need to change as it will then search those fields
      // as well, which may be un-desired. See docs.mongodb.com/manual/reference/operator/query/text/
      _.assignIn(query, { $text: { $search: queryString.text } });
    } else if (queryString.eq) {
      _.assignIn(query, { client: { $eq: queryString.eq } });
    }
  }
  if (args.swagger.params.tenureStage && args.swagger.params.tenureStage.value !== undefined) {
    _.assignIn(query, { tenureStage: args.swagger.params.tenureStage.value });
  }
  if (args.swagger.params.areaHectares && args.swagger.params.areaHectares.value !== undefined) {
    let queryString = qs.parse(args.swagger.params.areaHectares.value);
    if (queryString.gte && queryString.lte) {
      // Combine queries as logical AND to compute a Rnage of values.
      _.assignIn(query, {
        $and: [
          {
            areaHectares: { $gte: parseFloat(queryString.gte, 10) }
          },
          {
            areaHectares: { $lte: parseFloat(queryString.lte, 10) }
          }
        ]
      });
    } else if (queryString.eq) {
      // invalid or not specified, treat as equal
      _.assignIn(query, {
        areaHectares: { $eq: parseFloat(queryString.eq, 10) }
      });
    } else {
      // Which param was set?
      if (queryString.gte) {
        _.assignIn(query, {
          areaHectares: { $gte: parseFloat(queryString.gte, 10) }
        });
      }
      if (queryString.lte) {
        _.assignIn(query, {
          areaHectares: { $lte: parseFloat(queryString.lte, 10) }
        });
      }
    }
  }
  if (args.swagger.params.centroid && args.swagger.params.centroid.value !== undefined) {
    // defaultLog.info("Looking up features based on coords:", args.swagger.params.centroid.value);
    // Throws if parsing fails.
    let coordinates = JSON.parse(args.swagger.params.centroid.value)[0];
    // restrict lat and lng to valid bounds
    // safety check: fallback for invalid lat or lng is 0
    coordinates = coordinates.map(function(coord) {
      const lng = Math.max(Math.min(coord[0] || 0, 179.9999), -180); // -180 to +179.9999
      const lat = Math.max(Math.min(coord[1] || 0, 89.9999), -90); // -90 to +89.9999
      return [lng, lat];
    });

    if (coordinates.length == 2) {
      // use geoWithin box query
      _.assignIn(query, {
        centroid: {
          $geoWithin: {
            $box: coordinates
          }
        }
      });
    } else {
      // use geoIntersects polygon query
      // specify custom MongoDB CRS to support queries with area larger than a single hemisphere
      _.assignIn(query, {
        centroid: {
          $geoIntersects: {
            $geometry: {
              type: 'Polygon',
              coordinates: [coordinates],
              crs: {
                type: 'name',
                properties: { name: 'urn:x-mongodb:crs:strictwinding:EPSG:4326' }
              }
            }
          }
        }
      });
    }
  }

  // Allows filtering of Records based on their last status change.
  if (
    args.swagger.params.statusHistoryEffectiveDate &&
    args.swagger.params.statusHistoryEffectiveDate.value !== undefined
  ) {
    let queryString = qs.parse(args.swagger.params.statusHistoryEffectiveDate.value);
    if (queryString.since && queryString.until) {
      _.assignIn(query, {
        $and: [
          { statusHistoryEffectiveDate: { $gte: new Date(queryString.since) } },
          { statusHistoryEffectiveDate: { $lte: new Date(queryString.until) } }
        ]
      });
    } else if (queryString.since) {
      _.assignIn(query, {
        $or: [
          { statusHistoryEffectiveDate: null },
          { statusHistoryEffectiveDate: { $gte: new Date(queryString.since) } }
        ]
      });
    } else if (queryString.until) {
      _.assignIn(query, {
        $or: [
          { statusHistoryEffectiveDate: null },
          { statusHistoryEffectiveDate: { $lte: new Date(queryString.until) } }
        ]
      });
    }
  }

  defaultLog.debug('query:', JSON.stringify(query));

  return query;
};
/* eslint-enable no-redeclare */
let mongoose = require('mongoose');
let ObjectId = require('mongoose').Types.ObjectId;
let mongodb = require('../../utils/mongodb');

/**
 * Performs all operations necessary to create a master Self Report record and its associated flavour records.
 *
 * Example of incomingObj
 *
 *  selfReports: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'selfReport',
 *      ...
 *      SelfReportLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @returns object containing the operation's status and created records
 */
exports.createRecord = async function (args, res, next, incomingObj) {
  let flavours = [];
  let flavourIds = [];
  let observables = [];
  // We have this in case there's error and we need to clean up.
  let idsToDelete = [];

  // Prepare flavours
  incomingObj.SelfReportLNG &&
    flavours.push(this.createLNG(args, res, next, { ...incomingObj, ...incomingObj.SelfReportLNG }));

  // Get flavour ids for master
  if (flavours.length > 0) {
    flavourIds = flavours.map(
      flavour => flavour._id
    );
    idsToDelete = [...flavourIds];
  }

  // Prepare master
  let masterRecord = this.createMaster(args, res, next, incomingObj, flavourIds);
  idsToDelete.push(masterRecord._id);

  // Set master back ref to flavours get ready to save
  for (let i = 0; i < flavours.length; i++) {
    flavours[i]._master = new ObjectId(masterRecord._id);
    observables.push(flavours[i].save());
  }
  observables.push(masterRecord.save());

  // Attempt to save everything.

  let result = null;
  try {
    result = await Promise.all(observables);
  } catch (e) {
    // Something went wrong. Attempt to clean up
    const db = mongodb.connection.db(process.env.MONGODB_DATABASE || 'nrpti-dev');
    const collection = db.collection('nrpti');
    let orArray = [];
    for (let i = 0; i < idsToDelete.length; i++) {
      orArray.push({ _id: new ObjectId(idsToDelete[i]) });
    }
    await collection.deleteMany({
      $or: orArray
    });

    return {
      status: 'failure',
      object: result,
      errorMessage: e.message
    };
  }
  return {
    status: 'success',
    object: result
  };
};

/**
 * Performs all operations necessary to create a master Self Report record.
 *
 * Example of incomingObj
 *
 *  selfReports: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'selfReport',
 *      ...
 *      SelfReportLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @param {*} flavourIds array of flavour record _ids
 * @returns created master selfReport record
 */
exports.createMaster = function (args, res, next, incomingObj, flavourIds) {
  let SelfReport = mongoose.model('SelfReport');
  let selfReport = new SelfReport();

  selfReport._schemaName = 'SelfReport';

  // set integration references
  incomingObj._epicProjectId &&
    ObjectId.isValid(incomingObj._epicProjectId) &&
    (selfReport._epicProjectId = new ObjectId(incomingObj._epicProjectId));
  incomingObj._sourceRefId &&
    ObjectId.isValid(incomingObj._sourceRefId) &&
    (selfReport._sourceRefId = new ObjectId(incomingObj._sourceRefId));
  incomingObj._epicMilestoneId &&
    ObjectId.isValid(incomingObj._epicMilestoneId) &&
    (selfReport._epicMilestoneId = new ObjectId(incomingObj._epicMilestoneId));

  // set permissions
  selfReport.read = ['sysadmin'];
  selfReport.write = ['sysadmin'];

  // set forward references
  if (flavourIds && flavourIds.length) {
    flavourIds.forEach(id => {
      if (ObjectId.isValid(id)) {
        selfReport._flavourRecords.push(new ObjectId(id));
      }
    });
  }

  // set data
  incomingObj.recordName && (selfReport.recordName = incomingObj.recordName);
  selfReport.recordType = 'Compliance Self-Report';
  incomingObj.dateIssued && (selfReport.dateIssued = incomingObj.dateIssued);
  incomingObj.issuingAgency && (selfReport.issuingAgency = incomingObj.issuingAgency);
  incomingObj.author && (selfReport.author = incomingObj.author);
  incomingObj.legislation && incomingObj.legislation.act && (selfReport.legislation.act = incomingObj.legislation.act);
  incomingObj.legislation &&
    incomingObj.legislation.regulation &&
    (selfReport.legislation.regulation = incomingObj.legislation.regulation);
  incomingObj.legislation &&
    incomingObj.legislation.section &&
    (selfReport.legislation.section = incomingObj.legislation.section);
  incomingObj.legislation &&
    incomingObj.legislation.subSection &&
    (selfReport.legislation.subSection = incomingObj.legislation.subSection);
  incomingObj.legislation &&
    incomingObj.legislation.paragraph &&
    (selfReport.legislation.paragraph = incomingObj.legislation.paragraph);
  incomingObj.legislationDescription && (selfReport.legislationDescription = incomingObj.legislationDescription);
  incomingObj.projectName && (selfReport.projectName = incomingObj.projectName);
  incomingObj.location && (selfReport.location = incomingObj.location);
  incomingObj.centroid && (selfReport.centroid = incomingObj.centroid);
  incomingObj.documents && (selfReport.documents = incomingObj.documents);

  // set meta
  selfReport.addedBy = args.swagger.params.auth_payload.displayName;
  selfReport.dateAdded = new Date();

  // set data source references
  incomingObj.sourceDateAdded && (selfReport.sourceDateAdded = incomingObj.sourceDateAdded);
  incomingObj.sourceDateUpdated && (selfReport.sourceDateUpdated = incomingObj.sourceDateUpdated);
  incomingObj.sourceSystemRef && (selfReport.sourceSystemRef = incomingObj.sourceSystemRef);

  return selfReport;
};

/**
 * Performs all operations necessary to create a LNG Self Report record.
 *
 * Example of incomingObj
 *
 *  selfReports: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'selfReport',
 *      ...
 *      SelfReportLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @returns created lng selfReport record
 */
exports.createLNG = function (args, res, next, incomingObj) {
  let SelfReportLNG = mongoose.model('SelfReportLNG');
  let selfReportLNG = new SelfReportLNG();

  selfReportLNG._schemaName = 'SelfReportLNG';

  // set integration references
  incomingObj._epicProjectId &&
    ObjectId.isValid(incomingObj._epicProjectId) &&
    (selfReportLNG._epicProjectId = new ObjectId(incomingObj._epicProjectId));
  incomingObj._sourceRefId &&
    ObjectId.isValid(incomingObj._sourceRefId) &&
    (selfReportLNG._sourceRefId = new ObjectId(incomingObj._sourceRefId));
  incomingObj._epicMilestoneId &&
    ObjectId.isValid(incomingObj._epicMilestoneId) &&
    (selfReportLNG._epicMilestoneId = new ObjectId(incomingObj._epicMilestoneId));

  // set permissions and meta
  selfReportLNG.read = ['sysadmin'];
  selfReportLNG.write = ['sysadmin'];

  // If incoming object has addRole: 'public' then read will look like ['sysadmin', 'public']
  if (incomingObj.addRole && incomingObj.addRole === 'public') {
    selfReportLNG.read.push('public');
    selfReportLNG.datePublished = new Date();
    selfReportLNG.publishedBy = args.swagger.params.auth_payload.displayName;
  }

  selfReportLNG.addedBy = args.swagger.params.auth_payload.displayName;
  selfReportLNG.dateAdded = new Date();

  // set master data
  incomingObj.recordName && (selfReportLNG.recordName = incomingObj.recordName);
  selfReportLNG.recordType = 'Compliance Self-Report';
  incomingObj.dateIssued && (selfReportLNG.dateIssued = incomingObj.dateIssued);
  incomingObj.issuingAgency && (selfReportLNG.issuingAgency = incomingObj.issuingAgency);
  incomingObj.author && (selfReportLNG.author = incomingObj.author);
  incomingObj.legislation &&
    incomingObj.legislation.act &&
    (selfReportLNG.legislation.act = incomingObj.legislation.act);
  incomingObj.legislation &&
    incomingObj.legislation.regulation &&
    (selfReportLNG.legislation.regulation = incomingObj.legislation.regulation);
  incomingObj.legislation &&
    incomingObj.legislation.section &&
    (selfReportLNG.legislation.section = incomingObj.legislation.section);
  incomingObj.legislation &&
    incomingObj.legislation.subSection &&
    (selfReportLNG.legislation.subSection = incomingObj.legislation.subSection);
  incomingObj.legislation &&
    incomingObj.legislation.paragraph &&
    (selfReportLNG.legislation.paragraph = incomingObj.legislation.paragraph);
  incomingObj.legislationDescription && (selfReportLNG.legislationDescription = incomingObj.legislationDescription);
  incomingObj.projectName && (selfReportLNG.projectName = incomingObj.projectName);
  incomingObj.location && (selfReportLNG.location = incomingObj.location);
  incomingObj.centroid && (selfReportLNG.centroid = incomingObj.centroid);
  incomingObj.documents && (selfReportLNG.documents = incomingObj.documents);

  // set flavour data
  incomingObj.description && (selfReportLNG.description = incomingObj.description);
  incomingObj.relatedPhase && (selfReportLNG.relatedPhase = incomingObj.relatedPhase);

  // set data source references
  incomingObj.sourceDateAdded && (selfReportLNG.sourceDateAdded = incomingObj.sourceDateAdded);
  incomingObj.sourceDateUpdated && (selfReportLNG.sourceDateUpdated = incomingObj.sourceDateUpdated);
  incomingObj.sourceSystemRef && (selfReportLNG.sourceSystemRef = incomingObj.sourceSystemRef);

  return selfReportLNG;
};
